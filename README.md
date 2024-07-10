# Finance Tracker

Finance Tracker is a Ruby on Rails application designed for personal finance management.

## Technologies Used

- Ruby version: 3.1.2
- Rails version: 7.1.3
- esbuild
- TailwindCSS
- Devise for authentication
- Pagy for pagination
- Yarn as package manager
- Propshaft
- SQLite3

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Ruby 3.1.2
- Rails 7.1.3
- Yarn
- SQLite3

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/plizarraga/finance-tracker.git
   cd finance-tracker
   ```

2. **Install dependencies:**

   ```bash
   bundle install
   yarn install
   ```

3. **Setup the database:**

   ```bash
   rails db:setup
   ```

   This will create the database, load the schema, and initialize it with seed data.

### Running the Application

Start the Rails server:

```bash
bin/dev
```

The application will be available at `http://localhost:3000`.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). See the [LICENSE](https://github.com/plizarraga/finance-tracker/blob/main/LICENSE) file for details.
