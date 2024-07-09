class CreateAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :accounts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name
      t.decimal :balance, precision: 8, scale: 2

      t.timestamps
    end
  end
end
