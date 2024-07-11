module SystemHelpers
  def sign_up_with(first_name, last_name, email, password)
    visit new_user_registration_path
    fill_in "First name",	with: first_name
    fill_in "Last name",	with: last_name
    fill_in "Email", with: email
    fill_in "Password", with: password
    fill_in "Password confirmation", with: password
    click_on "Sign up"
  end

  def sign_in_with(email, password)
    visit new_user_session_path
    fill_in "Email", with: email
    fill_in "Password", with: password
    click_on "Log in"
  end

  def sign_out
    click_on "user-menu-button"
    click_on "Sign out"
  end
end