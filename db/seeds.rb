# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# user = User.find_or_create_by!(first_name: "John", last_name: "Doe", email: "john.doe@example.com", password: "123123", password_confirmation: "123123")
user = User.create!(first_name: "John", last_name: "Doe", email: "john.doe@example.com", password: "123123", password_confirmation: "123123")

# Create 5 categories
salary = Category.create!(name: "Salary", user: user)
grocery_category = Category.create!(name: "Grocery", user: user)
fast_food_category = Category.create!(name: "Fast food", user: user)
gas_category = Category.create!(name: "Gas", user: user)

# Create accounts
checking_account = Account.create!(name: "Checking", balance: 5000, user: user)
saving_account = Account.create!(name: "Savings", balance: 10000, user: user)

# Create incoming transactions
income = Transaction.transaction_types[:income]
Transaction.create!(title: 'Salary', notes: 'Monthly salary',transaction_type: income, amount: 2000, account: checking_account, category: salary, date: 3.month.ago, user: user)
Transaction.create!(title: 'Salary', notes: 'Monthly salary',transaction_type: income, amount: 3000, account: checking_account, category: salary, date: 2.month.ago, user: user)
Transaction.create!(title: 'Salary', notes: 'Monthly salary',transaction_type: income, amount: 5000, account: checking_account, category: salary, date: 1.month.ago, user: user)
Transaction.create!(title: 'Salary', notes: 'Monthly salary',transaction_type: income, amount: 5000, account: saving_account, category: salary, date: Date.today, user: user)


# Create expense transactions
expense = Transaction.transaction_types[:expense]
Transaction.create!(title: 'Grocery', notes: 'Grocery shopping', transaction_type: expense, amount: 300, account: checking_account, category: grocery_category, date: Date.today, user: user)
Transaction.create!(title: 'Fast food', notes: 'Fast food order', transaction_type: expense, amount: 300, account: saving_account, category: fast_food_category, date: Date.today, user: user)
Transaction.create!(title: 'Gas', notes: 'Gas 5 liters', transaction_type: expense, amount: 300, account: checking_account, category: gas_category, date: Date.today, user: user)