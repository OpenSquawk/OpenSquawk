#!/usr/bin/env tsx
import 'dotenv/config'
import path from 'node:path'
import fs from 'node:fs/promises'
import mongoose from 'mongoose'
import type { DecisionTreeDTO, DecisionTreeNode, DecisionTelemetryField } from '../shared/types/decisionTree'
import { DecisionTree } from '../server/models/DecisionTree'
import { applyDecisionTreePayload } from '../server/utils/decisionTree'

async function loadLegacyTree(): Promise<any> {
  const filePath = path.resolve(process.cwd(), 'shared/data/atcDecisionTree.ts')
  const source = await fs.readFile(filePath, 'utf8')
  const sanitized = source.replace(/export\s+default\s+atcDecisionTree;?\s*$/m, 'return atcDecisionTree;')
  const loader = new Function(sanitized)
  return loader()
}

function defaultTelemetrySchema(): DecisionTelemetryField[] {
  return [
    { key: 'altitude_ft', label: 'Altitude', unit: 'ft', type: 'number', description: 'Barometric altitude', default: 0 },
    { key: 'speed_kts', label: 'IAS', unit: 'kt', type: 'number', description: 'Indicated airspeed', default: 0 },
    { key: 'groundspeed_kts', label: 'Ground speed', unit: 'kt', type: 'number', default: 0 },
    { key: 'vertical_speed_fpm', label: 'Vertical speed', unit: 'fpm', type: 'number', default: 0 },
    { key: 'heading_deg', label: 'Heading', unit: '°', type: 'number', default: 0 },
    { key: 'latitude', label: 'Latitude', unit: '°', type: 'number' },
    { key: 'longitude', label: 'Longitude', unit: '°', type: 'number' },
  ]
}

function buildLayout(nodes: DecisionTreeNode[], phases: string[]) {
  const laneIndex = new Map<string, number>()
  phases.forEach((phase, idx) => laneIndex.set(phase, idx))
  const laneCounts = new Map<string, number>()
  const xSpacing = 420
  const ySpacing = 160

  for (const node of nodes) {
    const phase = node.data?.phase || 'General'
    const lane = laneIndex.has(phase) ? laneIndex.get(phase)! : phases.length
    const row = laneCounts.get(phase) ?? 0
    laneCounts.set(phase, row + 1)
    node.ui = {
      x: lane * xSpacing,
      y: row * ySpacing,
      lane: phase,
    }
  }
}

function convertLegacyToDto(legacy: any): DecisionTreeDTO {
  const phases: string[] = Array.isArray(legacy.phases) ? legacy.phases : []
  const states = legacy.states || {}

  const nodes: DecisionTreeNode[] = Object.entries(states).map(([id, value]: [string, any]) => {
    const data = JSON.parse(JSON.stringify(value || {}))
    const title = data.prompt_out || data.say_tpl || data.utterance_tpl || id
    const summary = data.prompt_out || data.say_tpl || undefined
    const node: DecisionTreeNode = {
      id,
      title,
      summary,
      data,
      autoTransitions: Array.isArray(data.auto_transitions) ? [...data.auto_transitions] : undefined,
      llmTemplates: data.llm_templates ? { ...data.llm_templates } : undefined,
      notes: data.router_note || undefined,
    }
    return node
  })

  buildLayout(nodes, phases)

  return {
    tree: {
      slug: (legacy.name || 'icao_atc_decision_tree').toString(),
      title: legacy.description ? String(legacy.description).split('.')[0] : 'ICAO ATC Decision Tree',
      description: legacy.description || undefined,
      schemaVersion: legacy.schema_version || '1.0',
      startState: legacy.start_state,
      endStates: Array.isArray(legacy.end_states) ? legacy.end_states : [],
      variables: legacy.variables || {},
      flags: legacy.flags || {},
      policies: legacy.policies || {},
      hooks: legacy.hooks || {},
      roles: Array.isArray(legacy.roles) ? legacy.roles : ['pilot', 'atc', 'system'],
      phases,
      telemetrySchema: defaultTelemetrySchema(),
    },
    nodes,
    updatedAt: new Date().toISOString(),
    metadata: {
      lastImportedFrom: 'shared/data/atcDecisionTree.ts',
      lastImportedAt: new Date().toISOString(),
    },
  }
}

async function main() {
  const legacy = await loadLegacyTree()
  const dto = convertLegacyToDto(legacy)

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/opensquawk'
  await mongoose.connect(uri)

  let tree = await DecisionTree.findOne({ slug: dto.tree.slug })
  if (!tree) {
    tree = new DecisionTree({
      slug: dto.tree.slug,
      title: dto.tree.title,
      startState: dto.tree.startState,
    })
  }

  applyDecisionTreePayload(tree, dto, {
    id: 'import-script',
    email: 'system@opensquawk.local',
    name: 'Decision Tree Import',
  })

  tree.metadata = tree.metadata || {}
  tree.metadata.lastImportedFrom = dto.metadata?.lastImportedFrom
  tree.metadata.lastImportedAt = new Date()

  await tree.save()
  await mongoose.disconnect()

  console.log(`Imported decision tree "${dto.tree.slug}" with ${dto.nodes.length} nodes.`)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exitCode = 1
})
