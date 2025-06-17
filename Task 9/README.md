# Service Analysis Report Generator

A console application that generates comprehensive, markdown-formatted reports about services or products using AI analysis.

## Features

- Accepts service name (e.g., "Spotify", "Notion") or service description
- Generates detailed analysis reports with multiple sections
- Output formatted in Markdown
- Saves reports to files automatically
- Beautiful console interface with colored output

## Requirements

- Node.js 16.0 or higher
- OpenAI API key

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <project-directory>
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Add your OpenAI API key:**
   - Create a file named `.env` in the project root (не добавляйте его в репозиторий!)
   - Вставьте строку:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```
4. **Run the application:**
   ```bash
   npm start
   ```

## Usage

- Выберите тип ввода:
  - `1` — введите название известного сервиса (например, Spotify, Notion)
  - `2` — введите текстовое описание сервиса (завершите ввод двойным Enter)
- Отчёт будет выведен в консоль и сохранён в файл (например, `report_spotify.md`)

## Report Sections

Каждый отчёт содержит:
- Brief History (Краткая история)
- Target Audience (Целевая аудитория)
- Core Features (Ключевые функции)
- Unique Selling Points (Уникальные преимущества)
- Business Model (Бизнес-модель)
- Tech Stack Insights (Анализ технологий)
- Perceived Strengths (Сильные стороны)
- Perceived Weaknesses (Слабые стороны)

## Example Usage

```bash
$ npm start
Service Analysis Report Generator

Choose input type:
1. Service name (e.g., 'Spotify', 'Notion')
2. Service description

Enter your choice (1 or 2): 1
Enter service name: Spotify

Starting report generation...
[Report content will be displayed here]
Report saved to report_spotify.md
```

## Sample Outputs

See [sample_outputs.md](./sample_outputs.md) for real examples of generated reports.

## Troubleshooting

- **403 Country, region, or territory not supported**
  - OpenAI API может быть недоступен в некоторых странах. Используйте VPN с сервером в разрешённой стране (например, Германия, Польша, США).
  - После подключения к VPN перезапустите терминал и приложение.
- **.env не должен попадать в репозиторий!**
  - Убедитесь, что файл `.env` добавлен в `.gitignore`.
- **API key not found**
  - Проверьте, что файл `.env` находится в корне проекта и содержит строку `OPENAI_API_KEY=...`

## Notes

- Убедитесь, что ваш OpenAI API key действителен и не превышен лимит запросов
- Используется модель gpt-4.1-mini
- Отчёты сохраняются с автоматическим именованием по сервису 