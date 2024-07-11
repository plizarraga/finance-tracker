module SystemHelpers
  def sing_up
    visit "/"
    click_on "create your account for FREE"
    fill_in "First name",	with: "John"
    fill_in "Last name",	with: "Doe" 
    fill_in "Email", with: "john.doe@example.com"
    fill_in "Password", with: "123123"
    fill_in "Password confirmation", with: "123123"
    click_on "Sign up"
  end

  def sign_in
    fill_in "Email", with: "john.doe@example.com"
    fill_in "Password", with: "123123"
    click_on "Log in"
  end

  def sign_out
    click_on "user-menu-button"
    click_on "Sign out"
  end
end