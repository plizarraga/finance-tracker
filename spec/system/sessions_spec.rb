require 'rails_helper'

RSpec.describe "Signins", type: :system do
  before do
    driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
  end

  describe "on successful signin" do
    it "I am logged in" do
      # Arrange: Perform signup and then sign out
      # sing_up
      # sign_out
      visit "/"
      
      # Assert: Verify that the Sign in link is present after signing out
      expect(page).to have_content("Sign in")

      # Act: Fill in signin form fields and submit
      fill_in "Email", with: "john.doe@example.com"
      fill_in "Password", with: "123123"
      click_button "Log in"

      # Assert: Verify that the user is logged in and redirected to the members area
      expect(page).to have_content("Welcome to the members area john.doe@example.com")
    end
  end
end
