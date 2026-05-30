// ai-evaluator.js
// This Node.js script evaluates the best employee and team for a project using the OpenAI API.
// Requires Node.js v18+ (uses native fetch)

const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE"; // Replace with your actual key

/**
 * AI function to evaluate the best team and employee for a project.
 * 
 * @param {Object} project - The project requirements {clientName, siteName, scope}
 * @param {Array} teams - Array of teams {teamName, leaders, members}
 * @param {Array} employees - Array of employees {name, skills}
 * @returns {Promise<Object>} JSON response containing best employee and team with reasons
 */
async function evaluateAllocation(project, teams, employees) {
    const prompt = `
You are an expert Resource Manager AI.
Your task is to evaluate a list of employees and teams against a specific project's requirements.
You must return the best single employee and the best single team for the project, along with a detailed reason for your choices.

Project:
${JSON.stringify(project, null, 2)}

Available Teams:
${JSON.stringify(teams, null, 2)}

Available Employees:
${JSON.stringify(employees, null, 2)}

Instructions:
1. "Best Employee": Choose any employee from the entire list who best matches the project 'scope' (skills required). You can select the best from anyone regardless of their team.
2. "Best Team": Choose the team whose combined members and leaders best cover the project 'scope'.
3. "Reasoning": Provide a clear explanation of WHY they are the best fit, mentioning specific skills. E.g. "He can say team A person best for working but team c full best can work on that" - show nuanced reasoning.
4. Output MUST be strictly valid JSON in the following format:
{
  "project": "Project Site Name",
  "bestEmployee": {
    "name": "Employee Name",
    "reason": "Why this employee is best..."
  },
  "bestTeam": {
    "name": "Team Name",
    "reason": "Why this team is best..."
  }
}
`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4", // or gpt-3.5-turbo
                messages: [
                    { role: "system", content: "You are a helpful assistant designed to output strict JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        let content = data.choices[0].message.content;
        // Clean up markdown syntax if the model outputs it
        if (content.startsWith('\`\`\`json')) {
            content = content.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
        }

        const jsonResult = JSON.parse(content);
        return jsonResult;

    } catch (error) {
        console.error("Evaluation Failed:", error.message);
        return { error: error.message };
    }
}

// ==========================================
// TEST EXECUTION
// ==========================================

const mockProject = {
    clientName: "TechCorp",
    siteName: "Building A Data Center",
    scope: ["firealarm", "networking", "cctv"]
};

const mockTeams = [
    { teamName: "Team Alpha", leaders: ["Alice"], members: ["Alice", "Bob"] },
    { teamName: "Team Beta", leaders: ["Charlie"], members: ["Charlie", "Diana"] }
];

const mockEmployees = [
    { name: "Alice", skills: ["firealarm", "cctv", "access control"] },
    { name: "Bob", skills: ["electrical", "plumbing", "networking"] },
    { name: "Charlie", skills: ["firealarm"] },
    { name: "Diana", skills: ["project management", "safety"] }
];

// Run the function if executed directly
if (require.main === module) {
    console.log("Starting AI Evaluation...");
    if (OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
        console.log("⚠️ WARNING: You have not set your OPENAI_API_KEY. The API call will fail.");
    }
    
    evaluateAllocation(mockProject, mockTeams, mockEmployees)
        .then(result => {
            console.log("\n--- JSON OUTPUT ---");
            console.log(JSON.stringify(result, null, 2));
        });
}

module.exports = { evaluateAllocation };
