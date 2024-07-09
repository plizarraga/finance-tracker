class Transaction < ApplicationRecord
  belongs_to :category
  belongs_to :account
  belongs_to :user

  enum transaction_type: {
    income: 'income',
    expense: 'expense'
  }

  validates :transaction_type, presence: true
  # validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
