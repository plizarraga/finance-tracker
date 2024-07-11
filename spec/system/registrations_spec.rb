require 'rails_helper'

RSpec.describe "Signups", type: :system do
  before do
    driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
  end

  describe "on successful signup" do
    it "registers and loged in the user" do
      # Arrange: Visit the root path and start signup process
      visit "/"
      click_on "create your account for FREE"

      # Act: Fill in signup form fields
      fill_in "First name", with: "John"
      fill_in "Last name", with: "Doe" 
      fill_in "Email", with: "john.doe@example.com"
      fill_in "Password", with: "123123"
      fill_in "Password confirmation", with: "123123"
      click_on "Sign up"

      # Assert: Check if user is logged in and redirected to the members area
      expect(page).to have_content("Welcome to the members area john.doe@example.com")
    end
  end
end
