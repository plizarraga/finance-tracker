class Transaction < ApplicationRecord
  belongs_to :category
  belongs_to :account
  belongs_to :user

  enum transaction_type: {
    income: 'income',
    expense: 'expense'
  }

  validates :transaction_type, :date, presence: true
  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }

  after_save :update_account_balance
  after_destroy :revert_account_balance
  
  def self.search(params)
    params[:filter].blank? ? all : where(
      "title LIKE ?", "%#{sanitize_sql_like(params[:filter])}%"
    )
  end

  private

  def update_account_balance
    account.update_balance(amount, transaction_type)
  end

  def revert_account_balance
    opposite_type = transaction_type == "income" ? "expense" : "income"
    account.update_balance(amount, opposite_type)
  end
end
