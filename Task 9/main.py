import os
from dotenv import load_dotenv
from openai import OpenAI
from rich.console import Console
from rich.markdown import Markdown

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Rich console
console = Console()

def generate_report(input_text: str, is_service_name: bool = False) -> str:
    """
    Generate a comprehensive report about a service using OpenAI API.
    
    Args:
        input_text (str): Service name or description
        is_service_name (bool): Whether the input is a service name
        
    Returns:
        str: Markdown formatted report
    """
    # Prepare the prompt
    if is_service_name:
        prompt = f"Generate a comprehensive analysis report about {input_text} service."
    else:
        prompt = f"Generate a comprehensive analysis report about the following service:\n\n{input_text}"
    
    prompt += """
    
    Please include the following sections:
    1. Brief History (founding year, milestones)
    2. Target Audience (primary user segments)
    3. Core Features (2-4 key functionalities)
    4. Unique Selling Points (key differentiators)
    5. Business Model (how the service makes money)
    6. Tech Stack Insights (technologies used)
    7. Perceived Strengths (standout features)
    8. Perceived Weaknesses (limitations)
    
    Format the response in Markdown."""

    try:
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are a professional business and technical analyst."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating report: {str(e)}"

def main():
    """Main function to run the application."""
    console.print("[bold blue]Service Analysis Report Generator[/bold blue]")
    console.print("\nChoose input type:")
    console.print("1. Service name (e.g., 'Spotify', 'Notion')")
    console.print("2. Service description (text)")
    
    choice = input("\nEnter your choice (1 or 2): ").strip()
    
    if choice == "1":
        input_text = input("\nEnter service name: ").strip()
        is_service_name = True
    elif choice == "2":
        console.print("\nEnter service description (press Enter twice to finish):")
        lines = []
        while True:
            line = input()
            if line == "":
                break
            lines.append(line)
        input_text = "\n".join(lines)
        is_service_name = False
    else:
        console.print("[bold red]Invalid choice. Please run the program again.[/bold red]")
        return

    console.print("\n[bold green]Generating report...[/bold green]")
    report = generate_report(input_text, is_service_name)
    
    # Display the report
    console.print(Markdown(report))
    
    # Save the report
    filename = f"report_{input_text.split()[0].lower()}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(report)
    console.print(f"\n[bold green]Report saved to {filename}[/bold green]")

if __name__ == "__main__":
    main() 