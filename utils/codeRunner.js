import { VM } from 'vm2';

// received help from chatgpt, prompt used: "how to allow visitors to run code without risking security?"
// this function allows users to execute javascript code in a safe, isolated environment
export async function executeCode(code, input = '') {
    // create a new VM instance with timeout and sandbox for isolated code execution
    const vm = new VM({
        timeout: 1000, // limits execution time to 1000 ms to prevent infinite loops
        sandbox: { input } // provides 'input' as a variable in the execution context
    });

    try {
        // try running the code inside the sandboxed VM environment
        const result = vm.run(code);
        return { success: true, output: result }; // returns success and result if no error
    } catch (error) {
        return { success: false, error: error.message };
    }
}