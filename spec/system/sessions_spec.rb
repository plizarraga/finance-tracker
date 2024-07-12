require 'rails_helper'

RSpec.describe "Signins", type: :system do
  let(:user) { build(:user) }

  before do
    driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
  end

  describe "on successful signin" do
    it "I am logged in" do
      # Sign up
      sign_up_with(user.first_name, user.last_name, user.email, user.password, )
      expect(page).to have_content("Welcome to the members area #{user.email}")
      
      # Sign out
      sign_out
      expect(page).to have_content("Sign in")

      # Sign in
      sign_in_with(user.email, user.password)
      expect(page).to have_content("Welcome to the members area #{user.email}")
    end
  end
end

# require 'rails_helper'

# RSpec.describe "Signins", type: :system do
#   let(:user) { create(:user) }

#   before do
#     driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
#   end

#   describe "on successful signin" do
#     it "I am logged in" do
#       sign_in_with(user.email, user.password)
#       expect(page).to have_content("Welcome to the members area #{user.email}")
#     end
#   end
# end