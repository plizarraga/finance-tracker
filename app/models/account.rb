class Account < ApplicationRecord
  belongs_to :user
  has_many :transactions, dependent: :destroy

  validates :name, presence: true
  validates :balance, presence: true, numericality: { greater_than_or_equal_to: 0 }
  
  def update_balance(amount, transaction_type)
    if transaction_type == "income"
      self.balance += amount
    elsif transaction_type == "expense"
      self.balance -= amount
    end
    save
  end
end
