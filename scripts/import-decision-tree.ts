import 'dotenv/config'
import mongoose from 'mongoose'
import { importATCDecisionTree, type ImportDecisionTreeOptions } from '../server/services/decisionImportService'

function parseArgs(): ImportDecisionTreeOptions {
  const options: ImportDecisionTreeOptions = {}
  const args = process.argv.slice(2)

  for (const arg of args) {
    if (arg.startsWith('--slug=')) {
      options.slug = arg.slice('--slug='.length)
    } else if (arg.startsWith('--name=')) {
      options.name = arg.slice('--name='.length)
    } else if (arg.startsWith('--description=')) {
      options.description = arg.slice('--description='.length)
    }
  }

  return options
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/opensquawk'
  console.log(`Connecting to MongoDB at ${mongoUri}`)
  await mongoose.connect(mongoUri)

  try {
    const options = parseArgs()
    const { flow, importedStates } = await importATCDecisionTree(options)

    console.log(`Imported decision flow "${flow.name}" (${flow.slug}) with ${importedStates} states.`)
    console.log('Start state:', flow.startState)
    console.log('Updated at:', flow.updatedAt)
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('Decision tree import failed:', error)
  process.exit(1)
})
