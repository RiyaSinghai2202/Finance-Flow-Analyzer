let expenses = [];
let totalBudget = 0;
let categoryChart = null;
let pieChart = null;
let dateChart = null;
let budgetChart = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    initCharts();
    updateTable();
    updateBudgetSummary();
});

function loadFromLocalStorage() {
    const savedExpenses = localStorage.getItem('expenses');
    const savedBudget = localStorage.getItem('totalBudget');
    
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
    
    if (savedBudget) {
        totalBudget = parseFloat(savedBudget);
        document.getElementById('budgetInput').value = totalBudget;
    }
}

function saveToLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('totalBudget', totalBudget.toString());
}

function initCharts() {
    try {
        // Destroy existing charts if they exist
        if (categoryChart instanceof Chart) categoryChart.destroy();
        if (pieChart instanceof Chart) pieChart.destroy();
        if (dateChart instanceof Chart) dateChart.destroy();
        if (budgetChart instanceof Chart) budgetChart.destroy();

        // Get canvas contexts
        const ctx1 = document.getElementById('categoryChart')?.getContext('2d');
        const ctx2 = document.getElementById('expensePieChart')?.getContext('2d');
        const ctx3 = document.getElementById('dateChart')?.getContext('2d');
        const ctx4 = document.getElementById('budgetChart')?.getContext('2d');

        if (!ctx1 || !ctx2 || !ctx3 || !ctx4) return;

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 20,
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    }
                }
            }
        };

        // Initialize all charts
        categoryChart = new Chart(ctx1, {
            type: 'bar',
            data: { labels: [], datasets: [] },
            options: commonOptions
        });

        pieChart = new Chart(ctx2, {
            type: 'pie',
            data: { labels: [], datasets: [] },
            options: commonOptions
        });

        dateChart = new Chart(ctx3, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                ...commonOptions,
                scales: { y: { beginAtZero: true } }
            }
        });

        budgetChart = new Chart(ctx4, {
            type: 'bar',
            data: { labels: ['Budget', 'Spent'], datasets: [] },
            options: {
                ...commonOptions,
                scales: { y: { beginAtZero: true } }
            }
        });

        updateCharts();
    } catch (error) {
        console.error("Chart initialization error:", error);
    }
}

function setBudget() {
    const budgetInput = document.getElementById('budgetInput');
    const value = parseFloat(budgetInput.value);
    
    if (isNaN(value)) {
        alert('Please enter a valid number');
        return;
    }
    
    totalBudget = value;
    updateBudgetSummary();
    updateCharts();
    saveToLocalStorage();
}

function addExpense() {
    const nameInput = document.getElementById('expenseName');
    const amountInput = document.getElementById('expenseAmount');
    const categoryInput = document.getElementById('expenseCategory');
    const dateInput = document.getElementById('expenseDate');

    // Validation
    if (!nameInput.value.trim()) {
        alert('Please enter an expense name');
        return;
    }

    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) )
    {
        alert('Please enter a valid amount');
        return;
    }

    if (!categoryInput.value) {
        alert('Please select a category');
        return;
    }

    if (!dateInput.value) {
        alert('Please select a date');
        return;
    }

    // Add new expense
    expenses.push({
        name: nameInput.value.trim(),
        amount: amount,
        category: categoryInput.value,
        date: dateInput.value
    });

    // Clear form
    nameInput.value = '';
    amountInput.value = '';
    categoryInput.value = '';
    dateInput.value = '';

    updateTable();
    updateBudgetSummary();
    updateCharts();
    saveToLocalStorage();
}

function updateTable() {
    const tableBody = document.querySelector("#expenseTable tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    const filterValue = document.getElementById('filterCategory').value;
    const filteredExpenses = filterValue === 'All' 
        ? expenses 
        : expenses.filter(exp => exp.category === filterValue);

    filteredExpenses.forEach((exp, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(exp.name)}</td>
            <td>$${exp.amount.toFixed(2)}</td>
            <td>${escapeHtml(exp.category)}</td>
            <td>${formatDate(exp.date)}</td>
            <td><button onclick="deleteExpense(${index})">Delete</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function deleteExpense(index) {
    if (index < 0 || index >= expenses.length) return;
    
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses.splice(index, 1);
        updateTable();
        updateBudgetSummary();
        updateCharts();
        saveToLocalStorage();
    }
}

function filterExpenses() {
    updateTable();
}

function updateBudgetSummary() {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const budgetSummary = document.getElementById("budgetSummary");
    const progressBar = document.getElementById("budgetProgress");
    
    if (!budgetSummary || !progressBar) return;
    
    budgetSummary.textContent = `Total Spent: $${totalSpent.toFixed(2)} / Budget: $${totalBudget.toFixed(2)}`;
    
    if (totalBudget > 0) {
        const percentage = Math.min((totalSpent / totalBudget) * 100, 100);
        progressBar.style.width = `${percentage}%`;
        
        progressBar.style.backgroundColor = 
            percentage > 100 ? '#f72585' : 
            percentage > 80 ? '#ffbe0b' : '#4cc9f0';
    }
}

function updateCharts() {
    if (!categoryChart || !pieChart || !dateChart || !budgetChart) return;

    try {
        // Update Category Chart
        const categories = [...new Set(expenses.map(exp => exp.category))];
        const categoryTotals = categories.map(cat => 
            expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0));
        
        categoryChart.data.labels = categories;
        categoryChart.data.datasets = [{
            label: 'Amount',
            data: categoryTotals,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }];
        categoryChart.update();

        // Update Pie Chart
        pieChart.data.labels = categories;
        pieChart.data.datasets = [{
            data: categoryTotals,
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)'
            ],
            borderWidth: 1
        }];
        pieChart.update();

        // Update Date Chart
        const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
        const dates = sortedExpenses.map(exp => formatDate(exp.date));
        const amounts = sortedExpenses.map(exp => exp.amount);
        
        dateChart.data.labels = dates;
        dateChart.data.datasets = [{
            label: 'Amount',
            data: amounts,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 2,
            tension: 0.1
        }];
        dateChart.update();

        // Update Budget Chart
        const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        budgetChart.data.datasets = [{
            label: 'Amount',
            data: [totalBudget, totalSpent],
            backgroundColor: [
                'rgba(75, 192, 192, 0.7)',
                'rgba(255, 99, 132, 0.7)'
            ],
            borderWidth: 1
        }];
        budgetChart.update();
    } catch (error) {
        console.error("Error updating charts:", error);
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateString;
    }
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        if (categoryChart) categoryChart.resize();
        if (pieChart) pieChart.resize();
        if (dateChart) dateChart.resize();
        if (budgetChart) budgetChart.resize();
    }, 250);
});