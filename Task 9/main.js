import 'dotenv/config';
import OpenAI from 'openai';
import chalk from 'chalk';
import MarkdownIt from 'markdown-it';
import { promises as fs } from 'fs';
import readline from 'readline';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize markdown parser
const md = new MarkdownIt();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function generateReport(inputText, isServiceName) {
  try {
    console.log(chalk.blue('\nPreparing API request...'));
    
    // Prepare the prompt
    const prompt = isServiceName
      ? `Generate a comprehensive analysis report about ${inputText} service.`
      : `Generate a comprehensive analysis report about the following service:\n\n${inputText}`;

    const fullPrompt = `${prompt}\n\nPlease include the following sections:
1. Brief History (founding year, milestones)
2. Target Audience (primary user segments)
3. Core Features (2-4 key functionalities)
4. Unique Selling Points (key differentiators)
5. Business Model (how the service makes money)
6. Tech Stack Insights (technologies used)
7. Perceived Strengths (standout features)
8. Perceived Weaknesses (limitations)

Format the response in Markdown.`;

    console.log(chalk.blue('Calling OpenAI API... This may take a minute...'));
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a professional business and technical analyst." },
        { role: "user", content: fullPrompt }
      ]
    });

    console.log(chalk.green('Successfully received response from OpenAI!'));
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error(chalk.red(`\nError generating report: ${error.message}`));
    console.error(chalk.yellow('Full error details:', error));
    return null;
  }
}

async function main() {
  try {
    console.log(chalk.blue.bold('Service Analysis Report Generator\n'));
    console.log('Choose input type:');
    console.log('1. Service name (e.g., "Spotify", "Notion")');
    console.log('2. Service description (text)\n');

    const choice = await question('Enter your choice (1 or 2): ');

    let inputText;
    let isServiceName;

    if (choice === '1') {
      inputText = await question('\nEnter service name: ');
      isServiceName = true;
    } else if (choice === '2') {
      console.log('\nEnter service description (press Enter twice to finish):');
      const lines = [];
      
      while (true) {
        const line = await question('');
        if (line === '') break;
        lines.push(line);
      }
      
      inputText = lines.join('\n');
      isServiceName = false;
    } else {
      console.log(chalk.red('\nInvalid choice. Please run the program again.'));
      process.exit(1);
    }

    console.log(chalk.green('\nStarting report generation...'));
    console.log(chalk.blue(`API Key status: ${process.env.OPENAI_API_KEY ? 'Found' : 'Not found'}`));
    
    const report = await generateReport(inputText, isServiceName);

    if (report) {
      // Display the report
      console.log('\nReport:');
      console.log(report);

      // Save the report
      const filename = `report_${inputText.split(' ')[0].toLowerCase()}.md`;
      await fs.writeFile(filename, report, 'utf8');
      console.log(chalk.green(`\nReport saved to ${filename}`));
    }
  } catch (error) {
    console.error(chalk.red(`\nError in main: ${error.message}`));
    console.error(chalk.yellow('Full error details:', error));
  } finally {
    rl.close();
  }
}

// Run the program
main(); 