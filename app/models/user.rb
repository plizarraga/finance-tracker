class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :trackable

  has_many :accounts
  has_many :categories
  has_many :transactions
  
  validates :email, presence: true, uniqueness: true
  validates :first_name, :last_name, presence: true

  def full_name
    [first_name, last_name].join(" ")
  end
end
