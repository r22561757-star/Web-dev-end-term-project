 const state = {
            transactions: [],
            categories: {
                expense: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Other'],
                income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
            },
            filters: {
                type: 'all',
                category: 'all'
            }
        };

   
        const elements = {
            balance: document.getElementById('balance'),
            income: document.getElementById('income'),
            expense: document.getElementById('expense'),
            transactionList: document.getElementById('transaction-list'),
            form: document.getElementById('transaction-form'),
            descriptionInput: document.getElementById('description'),
            amountInput: document.getElementById('amount'),
            typeSelect: document.getElementById('type'),
            categorySelect: document.getElementById('category'),
            filterType: document.getElementById('filter-type'),
            filterCategory: document.getElementById('filter-category'),
            clearBtn: document.getElementById('clear-all'),
            errorMsg: document.getElementById('error-message'),
            successMsg: document.getElementById('success-message')
        };

        let categoryChart = null;

        function init() {
            populateCategories();
            updateCategoryOptions();
            attachEventListeners();
            updateUI();
            updateChart();
        }

      
        function populateCategories() {
            updateCategoryOptions();
            updateFilterCategories();
        }


        function updateCategoryOptions() {
            const type = elements.typeSelect.value;
            const categories = state.categories[type];
            
            elements.categorySelect.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                elements.categorySelect.appendChild(option);
            });
        }

      
        function updateFilterCategories() {
            const allCategories = [...state.categories.expense, ...state.categories.income];
            const uniqueCategories = [...new Set(allCategories)];
            
            elements.filterCategory.innerHTML = '<option value="all">All Categories</option>';
            uniqueCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                elements.filterCategory.appendChild(option);
            });
        }

       
        function attachEventListeners() {
            elements.form.addEventListener('submit', handleAddTransaction);
            elements.typeSelect.addEventListener('change', updateCategoryOptions);
            elements.filterType.addEventListener('change', handleFilterChange);
            elements.filterCategory.addEventListener('change', handleFilterChange);
            elements.clearBtn.addEventListener('click', handleClearAll);
        }


        function handleAddTransaction(e) {
            e.preventDefault();
            

            const description = elements.descriptionInput.value.trim();
            const amount = parseFloat(elements.amountInput.value);
            const type = elements.typeSelect.value;
            const category = elements.categorySelect.value;
            
    
            if (!description) {
                showError('Please enter a description');
                return;
            }
            
            if (isNaN(amount) || amount <= 0) {
                showError('Please enter a valid positive amount');
                return;
            }
            
            if (!category) {
                showError('Please select a category');
                return;
            }
            
      
            const transaction = {
                id: Date.now(),
                description,
                amount,
                type,
                category,
                date: new Date().toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
            
        
            state.transactions.unshift(transaction);
            

            elements.form.reset();

            updateUI();
            updateChart();
            
        
            showSuccess(`Transaction added successfully: ${type === 'income' ? '+' : '-'}₹${amount.toFixed(2)}`);
        }


        function handleFilterChange() {
            state.filters.type = elements.filterType.value;
            state.filters.category = elements.filterCategory.value;
            updateTransactionList();
        }


        function handleClearAll() {
            if (state.transactions.length === 0) {
                showError('No transactions to clear');
                return;
            }
            
            if (confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
                state.transactions = [];
                state.filters.type = 'all';
                state.filters.category = 'all';
                elements.filterType.value = 'all';
                elements.filterCategory.value = 'all';
                updateUI();
                updateChart();
                showSuccess('All transactions cleared successfully');
            }
        }

        function deleteTransaction(id) {
            if (confirm('Are you sure you want to delete this transaction?')) {
                const index = state.transactions.findIndex(t => t.id === id);
                if (index !== -1) {
                    const deleted = state.transactions.splice(index, 1)[0];
                    updateUI();
                    updateChart();
                    showSuccess(`Transaction deleted: ${deleted.description}`);
                }
            }
        }


        function updateUI() {
            updateSummaryCards();
            updateTransactionList();
        }


        function updateSummaryCards() {
            let totalIncome = 0;
            let totalExpense = 0;
            
            state.transactions.forEach(t => {
                if (t.type === 'income') {
                    totalIncome += t.amount;
                } else {
                    totalExpense += t.amount;
                }
            });
            
            const balance = totalIncome - totalExpense;
            
            elements.balance.textContent = `₹${balance.toFixed(2)}`;
            elements.income.textContent = `₹${totalIncome.toFixed(2)}`;
            elements.expense.textContent = `₹${totalExpense.toFixed(2)}`;
        }


        function updateTransactionList() {
            elements.transactionList.innerHTML = '';
            
 
            let filtered = state.transactions.filter(t => {
                const typeMatch = state.filters.type === 'all' || t.type === state.filters.type;
                const categoryMatch = state.filters.category === 'all' || t.category === state.filters.category;
                return typeMatch && categoryMatch;
            });
            
            if (filtered.length === 0) {
                elements.transactionList.innerHTML = `
                    <div class="empty-state">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z"/>
                        </svg>
                        <p>No transactions found</p>
                    </div>
                `;
                return;
            }
            
            filtered.forEach(t => {
                const li = document.createElement('li');
                li.className = `transaction-item ${t.type}`;
                
                li.innerHTML = `
                    <div class="transaction-details">
                        <div class="transaction-description">${escapeHtml(t.description)}</div>
                        <div class="transaction-meta">${t.category} • ${t.date}</div>
                    </div>
                    <div class="transaction-amount">${t.type === 'income' ? '+' : '-'}₹${t.amount.toFixed(2)}</div>
                    <button class="btn-delete" onclick="deleteTransaction(${t.id})">Delete</button>
                `;
                
                elements.transactionList.appendChild(li);
            });
        }


        function updateChart() {
            const ctx = document.getElementById('category-chart').getContext('2d');
            
          
            if (categoryChart) {
                categoryChart.destroy();
            }
            
      
            const categoryData = {};
            state.transactions.forEach(t => {
                if (t.type === 'expense') {
                    categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
                }
            });
            
            const labels = Object.keys(categoryData);
            const data = Object.values(categoryData);
            
            if (labels.length === 0) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.font = '16px Arial';
                ctx.fillStyle = '#6c757d';
                ctx.textAlign = 'center';
                ctx.fillText('No expense data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
                return;
            }
            

            categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: [
                            '#ff6384',
                            '#36a2eb',
                            '#ffce56',
                            '#4bc0c0',
                            '#9966ff',
                            '#ff9f40',
                            '#c9cbcf',
                            '#4bc0c0'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        function showError(message) {
            elements.errorMsg.textContent = message;
            elements.errorMsg.style.display = 'block';
            elements.successMsg.style.display = 'none';
            
            setTimeout(() => {
                elements.errorMsg.style.display = 'none';
            }, 4000);
        }

      
        function showSuccess(message) {
            elements.successMsg.textContent = message;
            elements.successMsg.style.display = 'block';
            elements.errorMsg.style.display = 'none';
            
            setTimeout(() => {
                elements.successMsg.style.display = 'none';
            }, 3000);
        }

    
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

 
        init();
