# Product Search Tool

A console-based product search application that uses natural language processing to filter products based on user preferences. The application leverages OpenAI's GPT model to understand natural language queries and return relevant products from a predefined catalog.

## Features

- Natural language input for product search
- Support for multiple languages (English and Russian)
- Integration with OpenAI API for intelligent filtering
- Support for various search criteria:
  - Price ranges
  - Minimum/maximum ratings
  - Product categories
  - Stock availability
  - Combined criteria
- Formatted output display with product details
- Error handling and graceful exits

## Prerequisites

- Node.js (v14 or higher)
- OpenAI API key
- npm (Node Package Manager)

## Setup

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Project Structure

- `main.js` - Main application code with search logic
- `products.json` - Product database with sample items
- `README.md` - Documentation (this file)
- `sample_outputs.md` - Example outputs from various searches
- `.env` - Environment variables (not included in repository)
- `package.json` - Project configuration and dependencies

## Usage

1. Start the application:
   ```bash
   npm start
   ```

2. Enter your search query in natural language
   Examples:
   - "I need a smartphone under $800 with a great camera"
   - "Show me fitness equipment that's in stock"
   - "Find me kitchen appliances with rating above 4.5"
   - "Покажи товары для фитнеса в наличии"

3. View the filtered results
4. Type 'exit' to quit the application

## Search Capabilities

The tool supports various types of searches:

1. **Price-based filtering**
   - "under $100"
   - "between $50 and $200"
   - "cheaper than $500"

2. **Rating-based filtering**
   - "with good ratings"
   - "rating above 4.5"
   - "highly rated"

3. **Category filtering**
   - Electronics
   - Fitness
   - Kitchen
   - Books
   - Clothing

4. **Availability filtering**
   - "in stock"
   - "available now"
   - "show available items"

5. **Combined criteria**
   - "electronics under $100 with good ratings"
   - "fitness equipment in stock with rating above 4"

## Error Handling

The application handles various error scenarios:
- Invalid API keys
- Network issues
- Invalid search queries
- No matching products

## Sample Outputs

See `sample_outputs.md` for detailed examples of different search queries and their results.

## Note

Make sure to keep your OpenAI API key confidential and never commit it to the repository. The `.env` file is included in `.gitignore` to prevent accidental exposure of sensitive information. 