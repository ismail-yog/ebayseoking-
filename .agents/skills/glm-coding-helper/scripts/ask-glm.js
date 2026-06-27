const fs = require("fs");
const path = require("path");

// Resolve API key from environment or .env.local
let apiKey = process.env.NVIDIA_API_KEY;

if (!apiKey) {
  // Attempt to parse from .env.local if present in current directory
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/NVIDIA_API_KEY\s*=\s*(.+)/);
      if (match) {
        apiKey = match[1].trim();
      }
    }
  } catch (err) {
    // Ignore read errors
  }
}

if (!apiKey) {
  console.error("Error: NVIDIA_API_KEY not found in environment or .env.local.");
  process.exit(1);
}

const prompt = process.argv.slice(2).join(" ");
if (!prompt) {
  console.error("Error: Please provide a prompt. Example:\nnode ask-glm.js \"Write quicksort in JS\"");
  process.exit(1);
}

async function queryGLM() {
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "z-ai/glm-5.1",
        messages: [
          { role: "system", content: "You are GLM-5.1, an advanced AI coding assistant powered by Zhipu AI and NVIDIA NIM. Generate highly accurate, structured code and logic suggestions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Inference request failed: ${res.status} - ${errText}`);
    }
    
    const data = await res.json();
    console.log(data.choices[0].message.content);
  } catch (error) {
    console.error("Inference Error:", error.message);
    process.exit(1);
  }
}

queryGLM();
