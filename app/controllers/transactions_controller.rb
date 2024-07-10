class TransactionsController < ApplicationController
    include ActionView::RecordIdentifier
    # before_action :set_transactions, only: [:index]
    before_action :set_transaction, only: %i[show edit update destroy]
    before_action :set_accounts_and_categories, only: %i[new create edit update]

  # GET /transactions
  def index
    # @transactions = current_user.transactions.order(:date)
    # @total_expenses = @transactions.expense.sum(:amount)
    # @total_incomings = @transactions.income.sum(:amount)

    filtered = current_user.transactions.includes(:account, :category).search(params).order(date: :desc)
    @pagy, @transactions = pagy(filtered.all, items: 3)
  end

  # GET /transactions/1
  def show
  end

  # GET /transactions/new
  def new
    @transaction = Transaction.new
    # @accounts = current_user.accounts.order(:name)
    # @categories = current_user.categories.order(:name)
  end

  # GET /transactions/1/edit
  def edit
  end

  # POST /transactions
  def create
    @transaction = current_user.transactions.new(transaction_params)

    if @transaction.save
      redirect_to transactions_url, notice: "Transaction was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /transactions/1
  def update
    if @transaction.update(transaction_params)
      redirect_to transactions_url, notice: "Transaction was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /transactions/1
  def destroy
    @transaction.destroy
    redirect_to transactions_url, notice: "Transaction was successfully destroyed."
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_transaction
      if current_user && current_user.transactions.exists?(params[:id])
        @transaction = current_user.transactions.find(params[:id])
      else
        redirect_to transactions_path
      end
    end

    def set_accounts_and_categories
      @accounts = current_user.accounts.order(:name)
      @categories = current_user.categories.order(:name)  
      @transction_types = Transaction.transaction_types
    end

    def set_transactions
      @transactions = current_user.transactions.order(date: :desc)
      
      if params[:start_date].present? && params[:end_date].present?
        @transactions = @transactions.where(date: params[:start_date]..params[:end_date])
      end
    end

    # Only allow a list of trusted parameters through.
    def transaction_params
      params.require(:transaction).permit(:title, :notes, :transaction_type, :amount, :account_id, :category_id, :date)
    end
end
