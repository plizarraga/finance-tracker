require 'rails_helper'

RSpec.describe "When visiting the home page", type: :request do
  describe "GET /" do
    context "when signed in" do
      let(:user) { create(:user) }
      
      before do
        # Arrange: Sign in the user
        sign_in(user)
      end

      it "returns http success" do
        # Act: Make a GET request to the home page
        get "/"
        
        # Assert: Expect the response to be successful and contain a welcome message
        expect(response).to have_http_status(:success)
        expect(response.body).to include("Welcome to the members area #{user.email}")
      end
    end

    context "when signed out" do
      it "redirects to sign in" do
        # Act: Make a GET request to the home page without signing in
        
        get "/"
        
        # Assert: Expect the response to redirect to the sign-in page
        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end
end
