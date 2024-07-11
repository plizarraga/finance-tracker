require 'rails_helper'

RSpec.describe "Signups", type: :system do
  let(:user) { build(:user) }

  before do
    driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
  end

  describe "on successful signup" do
    it "I am registered and logged in" do
      sign_up_with(user.first_name, user.last_name, user.email, user.password, )
      expect(page).to have_content("Welcome to the members area #{user.email}")
    end
  end
end
