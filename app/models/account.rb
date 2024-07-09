class Account < ApplicationRecord
  belongs_to :user
  has_many :transactions

  validates :name, presence: true
  # validates :balance, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
