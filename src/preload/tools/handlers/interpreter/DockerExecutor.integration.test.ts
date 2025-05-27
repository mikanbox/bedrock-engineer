/**
 * DockerExecutor integration tests - requires actual Docker installation
 */

import { test, expect, beforeAll, beforeEach, afterEach, describe } from '@jest/globals'
import { DockerExecutor } from './DockerExecutor'
import { SecurityManager } from './SecurityManager'
import { ToolLogger } from '../../base/types'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('DockerExecutor Integration Tests', () => {
  let dockerExecutor: DockerExecutor
  let mockLogger: ToolLogger
  let securityManager: SecurityManager
  let tempWorkspace: string
  let dockerAvailable = false

  beforeAll(async () => {
    // Create mock logger
    mockLogger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      verbose: () => {}
    }

    // Create real security manager for integration test
    securityManager = new SecurityManager(mockLogger)
    dockerExecutor = new DockerExecutor(mockLogger, securityManager)

    // Check if Docker is actually available
    const dockerCheck = await dockerExecutor.checkDockerAvailability()
    dockerAvailable = dockerCheck.available

    if (!dockerAvailable) {
      console.warn('⚠️  Docker is not available. Integration tests will be skipped.')
      console.warn(`Docker check error: ${dockerCheck.error}`)
    }
  })

  beforeEach(async () => {
    if (!dockerAvailable) return

    // Create temporary workspace for each test
    tempWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'docker-executor-test-'))
  })

  afterEach(async () => {
    if (!dockerAvailable) return

    try {
      // Stop any running containers
      await dockerExecutor.stopAllContainers()

      // Clean up temporary workspace
      if (tempWorkspace) {
        await fs.rm(tempWorkspace, { recursive: true, force: true })
      }
    } catch (error) {
      console.warn('Warning: Failed to clean up test resources:', error)
    }
  })

  test('should check actual Docker availability', async () => {
    const result = await dockerExecutor.checkDockerAvailability()

    if (result.available) {
      expect(result.available).toBe(true)
      expect(result.error).toBeUndefined()
    } else {
      expect(result.available).toBe(false)
      expect(result.error).toBeDefined()
      console.log('Docker not available:', result.error)
    }
  })

  test('should execute simple Python code successfully', async () => {
    if (!dockerAvailable) {
      console.log('⏭️  Skipping test: Docker not available')
      return
    }

    const code = 'print("Hello from Docker!")'
    const result = await dockerExecutor.executeCode(code, 'python', tempWorkspace)

    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe('Hello from Docker!')
    // Note: stderr might contain Docker image pull logs on first run, so we check it's not a Python error
    if (result.stderr && result.stderr.length > 0) {
      // If there's stderr output, it should be Docker pull logs, not Python errors
      expect(result.stderr).not.toContain('Traceback')
      expect(result.stderr).not.toContain('Error:')
      console.log('Note: Docker image pull logs detected in stderr (expected on first run)')
    }
    expect(result.executionTime).toBeGreaterThan(0)
  })

  test('should execute Python code with calculations', async () => {
    if (!dockerAvailable) {
      console.log('⏭️  Skipping test: Docker not available')
      return
    }

    const code = `
import math
result = 2 + 3 * 4
pi_value = math.pi
print(f"Calculation result: {result}")
print(f"Pi value: {pi_value:.2f}")
print("Python math works!")
`

    const result = await dockerExecutor.executeCode(code, 'python', tempWorkspace)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Calculation result: 14')
    expect(result.stdout).toContain('Pi value: 3.14')
    expect(result.stdout).toContain('Python math works!')
    // Allow for Docker pull logs in stderr
    if (result.stderr && result.stderr.length > 0) {
      expect(result.stderr).not.toContain('Traceback')
      expect(result.stderr).not.toContain('Error:')
    }
  })

  test('should handle Python code with file creation', async () => {
    if (!dockerAvailable) {
      console.log('⏭️  Skipping test: Docker not available')
      return
    }

    const code = `
# Create a simple text file
with open('output.txt', 'w') as f:
    f.write('Hello from Python in Docker!\\n')
    f.write('This is line 2\\n')

# Read and print the file
with open('output.txt', 'r') as f:
    content = f.read()
    print("File content:")
    print(content)

print("File operations completed successfully!")
`

    const result = await dockerExecutor.executeCode(code, 'python', tempWorkspace)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('File content:')
    expect(result.stdout).toContain('Hello from Python in Docker!')
    expect(result.stdout).toContain('This is line 2')
    expect(result.stdout).toContain('File operations completed successfully!')
    // Allow for Docker pull logs in stderr
    if (result.stderr && result.stderr.length > 0) {
      expect(result.stderr).not.toContain('Traceback')
      expect(result.stderr).not.toContain('Error:')
    }

    // Verify the file was actually created in the workspace
    const outputFilePath = path.join(tempWorkspace, 'output.txt')
    const fileExists = await fs
      .access(outputFilePath)
      .then(() => true)
      .catch(() => false)
    expect(fileExists).toBe(true)

    if (fileExists) {
      const fileContent = await fs.readFile(outputFilePath, 'utf8')
      expect(fileContent).toContain('Hello from Python in Docker!')
      expect(fileContent).toContain('This is line 2')
    }
  })

  test('should handle Python syntax errors correctly', async () => {
    if (!dockerAvailable) {
      console.log('⏭️  Skipping test: Docker not available')
      return
    }

    const code = 'print("Missing closing quote and parenthesis'

    const result = await dockerExecutor.executeCode(code, 'python', tempWorkspace)

    expect(result.exitCode).not.toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('SyntaxError')
    expect(result.executionTime).toBeGreaterThan(0)
  })

  test('should handle Python runtime errors correctly', async () => {
    if (!dockerAvailable) {
      console.log('⏭️  Skipping test: Docker not available')
      return
    }

    const code = `
print("Starting execution...")
# This will cause a division by zero error
result = 10 / 0
print("This should not be printed")
`

    const result = await dockerExecutor.executeCode(code, 'python', tempWorkspace)

    expect(result.exitCode).not.toBe(0)
    expect(result.stdout).toContain('Starting execution...')
    expect(result.stderr).toContain('ZeroDivisionError')
    expect(result.executionTime).toBeGreaterThan(0)
  })

  test('should handle execution timeout', async () => {
    if (!dockerAvailable) {
      console.log('⏭️  Skipping test: Docker not available')
      return
    }

    const code = `
import time
print("Starting long operation...")
time.sleep(10)  # Sleep for 10 seconds
print("This should not be printed due to timeout")
`

    const config = {
      timeout: 2, // 2 second timeout
      memoryLimit: '128m', // Required field
      cpuLimit: 0.5 // Required field
    }

    const result = await dockerExecutor.executeCode(code, 'python', tempWorkspace, config)

    expect(result.exitCode).toBe(124) // Timeout exit code
    expect(result.stdout).toContain('Starting long operation...')
    expect(result.stderr).toContain('[Execution timed out]')
    expect(result.executionTime).toBeGreaterThanOrEqual(2000) // At least 2 seconds
  })

  test('should work with Python packages (standard library)', async () => {
    if (!dockerAvailable) {
      console.log('⏭️  Skipping test: Docker not available')
      return
    }

    const code = `
import json
import datetime
from collections import Counter

# Test JSON operations
data = {"name": "Docker Test", "version": 1.0, "active": True}
json_string = json.dumps(data)
parsed_data = json.loads(json_string)
print(f"JSON test: {parsed_data['name']}")

# Test datetime
now = datetime.datetime.now()
print(f"Current time: {now.strftime('%Y-%m-%d %H:%M:%S')}")

# Test collections
words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']
counter = Counter(words)
print(f"Word count: {dict(counter)}")

print("All standard library tests passed!")
`

    const result = await dockerExecutor.executeCode(code, 'python', tempWorkspace)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('JSON test: Docker Test')
    expect(result.stdout).toContain('Current time:')
    expect(result.stdout).toContain('Word count:')
    expect(result.stdout).toContain('All standard library tests passed!')
    // Allow for Docker pull logs in stderr
    if (result.stderr && result.stderr.length > 0) {
      expect(result.stderr).not.toContain('Traceback')
      expect(result.stderr).not.toContain('Error:')
    }
  })

  test('should properly isolate executions (no cross-contamination)', async () => {
    if (!dockerAvailable) {
      console.log('⏭️  Skipping test: Docker not available')
      return
    }

    // First execution creates a variable
    const code1 = `
test_variable = "First execution"
print(f"Set variable: {test_variable}")
`

    const result1 = await dockerExecutor.executeCode(code1, 'python', tempWorkspace)
    expect(result1.exitCode).toBe(0)
    expect(result1.stdout).toContain('Set variable: First execution')

    // Second execution should not have access to the variable from first execution
    const code2 = `
try:
    print(f"Variable from previous execution: {test_variable}")
    print("ERROR: Variable should not exist!")
except NameError:
    print("SUCCESS: Variable isolation working correctly")
`

    const result2 = await dockerExecutor.executeCode(code2, 'python', tempWorkspace)
    expect(result2.exitCode).toBe(0)
    expect(result2.stdout).toContain('SUCCESS: Variable isolation working correctly')
  })

  test('should handle multiple file operations', async () => {
    if (!dockerAvailable) {
      console.log('⏭️  Skipping test: Docker not available')
      return
    }

    const code = `
import os

# Create multiple files
files_to_create = ['file1.txt', 'file2.txt', 'data.json']

for filename in files_to_create:
    with open(filename, 'w') as f:
        f.write(f"Content of {filename}\\n")
        f.write(f"Created in Docker container\\n")

# List all files in current directory
files_in_dir = os.listdir('.')
python_files = [f for f in files_in_dir if not f.startswith('temp_')]

print(f"Created {len(python_files)} files:")
for file in sorted(python_files):
    print(f"  - {file}")

# Read one of the files
with open('file1.txt', 'r') as f:
    content = f.read()
    print(f"Content of file1.txt: {content.strip()}")

print("Multi-file operations completed!")
`

    const result = await dockerExecutor.executeCode(code, 'python', tempWorkspace)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Created 3 files:')
    expect(result.stdout).toContain('file1.txt')
    expect(result.stdout).toContain('file2.txt')
    expect(result.stdout).toContain('data.json')
    expect(result.stdout).toContain('Content of file1.txt: Content of file1.txt')
    expect(result.stdout).toContain('Multi-file operations completed!')
    // Allow for Docker pull logs in stderr
    if (result.stderr && result.stderr.length > 0) {
      expect(result.stderr).not.toContain('Traceback')
      expect(result.stderr).not.toContain('Error:')
    }

    // Verify files exist in workspace
    const files = await fs.readdir(tempWorkspace)
    const createdFiles = files.filter((f) => !f.startsWith('temp_'))
    expect(createdFiles.length).toBeGreaterThanOrEqual(3)
    expect(createdFiles).toContain('file1.txt')
    expect(createdFiles).toContain('file2.txt')
    expect(createdFiles).toContain('data.json')
  })
})
