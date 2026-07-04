const ctx = document.querySelector('.chart-area').getContext('2d')
const transactionsContainer = document.querySelector('.transactions-container')
const main = document.querySelector('main')
const contentContainer = document.querySelector('.content-container')
const settingsContainer = document.querySelector('.settings-container')
const dashboardBtn = document.querySelector('.dashboard-btn')
const settingsBtn = document.querySelector('.settings-btn')
const addTransactionContainer = document.querySelector('.add-transaction-container')
const addTransDate = document.querySelector('.add-trans-date')

let myChart = null
let editingId = null
let income = 0
let expense = 0
let currency = localStorage.getItem('currency')
    ? JSON.parse(localStorage.getItem('currency'))
    : '$'

let transactions = getLocalStorage()

function updateCurrency(e) {
    const newValue = e.closest('#currency').value.slice(5, 6)

    if (newValue == currency) return

    currency = newValue
    updateCards()
    filterTransactions()
    localStorage.setItem('currency', JSON.stringify(currency))
}

function updateCards() {
    const totalInEx = transactions.reduce((a, c) => {
        const key = `total${c.type}`
        a[key] = (a[key] || 0) + Number(c.amount)
        return a
    }, {})

    const currentBalance =
        (totalInEx.totalIncome || 0) -
        (totalInEx.totalExpense || 0)

    const totalTransactions = transactions.length

    main.querySelector('#current-balance').textContent = currency + currentBalance.toFixed(2)
    main.querySelector('#total-income').textContent = currency + (totalInEx.totalIncome || 0).toFixed(2)
    main.querySelector('#total-expense').textContent = currency + (totalInEx.totalExpense || 0).toFixed(2)
    main.querySelector('#total-transactions').textContent = totalTransactions

    income = totalInEx.totalIncome || 0
    expense = totalInEx.totalExpense || 0

    updateChart()
}

function renderTransactions(data) {
    const list = data || transactions
    transactionsContainer.innerHTML = list.map(t => `
        <div class="transaction" data-type=${t.type} data-id=${t.id}>
            <p>${t.date}</p>
            <p>${t.description}</p>
            <div>
            <p>${t.category}</p>
            </div>
            <p>${t.type == 'Income' ? '+' : '-'} ${currency}${t.amount}</p>
            <div>
                <i class="ri-pencil-fill edit"></i>
                <i class="ri-delete-bin-2-fill remove"></i>
            </div>
        </div>
    `).join('');
}

function filterTransactions() {
    const searchText = document.querySelector('.search-input').value.toLowerCase()
    const typeFilter = document.querySelector('#types').value
    const filtered = transactions.filter(t => {
        const matchSearch = t.description.toLowerCase().includes(searchText) || t.category.toLowerCase().includes(searchText)
        const matchType = typeFilter === 'All Types' ||
            (typeFilter === 'Income Only' && t.type === 'Income') ||
            (typeFilter === 'Expense Only' && t.type === 'Expense')
        return matchSearch && matchType
    })
    renderTransactions(filtered)
}

function createTransaction(e) {
    const parent = e.closest('.add-transaction')
    const type = parent.querySelector('[name= "type"]').value
    const description = parent.querySelector('[name= "description"]').value
    const amount = parent.querySelector('[name= "amount"]').value
    const date = parent.querySelector('[name= "date"]').value
    const category = parent.querySelector('[name= "category"]').value

    if (!type || !description || !amount || !date || !category) {
        alert('All fields are required')
        return
    }

    if (editingId) {
        const index = transactions.findIndex(t => t.id === editingId)
        if (index !== -1) {
            transactions[index] = { ...transactions[index], type, description, amount, date, category }
        }
        editingId = null
        parent.querySelector('.add-trans-top h2').textContent = 'Add Transaction'
    } else {
        transactions.unshift({ id: Date.now(), type, description, amount, date, category })
    }

    parent.querySelector('.add-trans-description').value = ''
    parent.querySelector('.add-trans-amount').value = ''
    parent.querySelector('.add-trans-date').value = ''

    addTransactionContainer.classList.add('none')
    setLocalStorage(transactions)
    updateCards()
    filterTransactions()
}

function editTransaction(e) {
    const id = Number(e.closest('.transaction').dataset.id)
    const transaction = transactions.find(t => t.id === id)
    if (!transaction) return

    const parent = main.querySelector('.add-transaction')
    parent.querySelector('[name="type"]').value = transaction.type
    parent.querySelector('.add-trans-description').value = transaction.description
    parent.querySelector('.add-trans-amount').value = transaction.amount
    parent.querySelector('.add-trans-date').value = transaction.date
    parent.querySelector('[name="category"]').value = transaction.category
    parent.querySelector('.add-trans-top h2').textContent = 'Edit Transaction'

    editingId = id
    addTransactionContainer.classList.remove('none')
}

function closeTransaction() {
    const parent = main.querySelector(".add-transaction")

    parent.querySelector('.add-trans-description').value = ''
    parent.querySelector('.add-trans-amount').value = ''
    parent.querySelector('.add-trans-date').value = ''
    parent.querySelector('.add-trans-top h2').textContent = 'Add Transaction'

    editingId = null
    addTransactionContainer.classList.toggle('none')
}

function removeTransaction(e) {
    const parent = e.closest('.transaction')

    const permission = confirm('Are you sure you want to delet this transaction')

    if (!permission) return

    const updatedData = transactions.filter(t => t.id !== Number(parent.dataset.id))

    transactions = updatedData

    setLocalStorage(updatedData)

    parent.remove()
    updateCards()
}

function reset() {
    if (transactions.length === 0) return

    if (!confirm('Are you sure you want to remove all the existing data')) return

    transactions = []
    currency = '$'
    localStorage.clear()

    setCurrency()
    updateCards()
    filterTransactions()
}

function updateChart() {
    if (myChart) { myChart.destroy() }
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Income vs Expense"],
            datasets: [
                { label: 'Income', data: [income], backgroundColor: '#f97316', borderRadius: 4 },
                { label: 'Expense', data: [expense], backgroundColor: '#78350f', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    })
}

function setLocalStorage(arr) {
    if (!arr || !Array.isArray(arr)) return
    localStorage.setItem('transactions', JSON.stringify(arr))
}

function getLocalStorage() {
    try { return JSON.parse(localStorage.getItem('transactions')) || [] }
    catch { return [] }
}

document.body.addEventListener('click', (e) => {
    if (e.target.closest('.ri-close-fill')) {
        closeTransaction(e.target)
    }
    if (e.target.closest('.add-btn')) {
        addTransactionContainer.classList.toggle('none')
        if (!addTransactionContainer.classList.contains('none')) {
            addTransDate.value = new Date().toISOString().split('T')[0]
        }
        return
    }
    if (e.target.closest('.save-transaction')) {
        createTransaction(e.target)
        return
    }
    if (e.target.closest('.edit')) {
        editTransaction(e.target)
        return
    }
    if (e.target.closest('.remove')) {
        removeTransaction(e.target)
        return
    }
    if (e.target.closest('.reset-btn')) {
        reset()
        return
    }
    if (e.target.closest('.toggle')) {
        document.body.classList.toggle('dark-theme')
        return
    }
    if (e.target.closest('#currency')) {
        updateCurrency(e.target)
        return
    }
    if (e.target.closest('.settings-btn')) {
        contentContainer.classList.add('none')
        settingsContainer.classList.remove('none')
        dashboardBtn.classList.remove('active')
        settingsBtn.classList.add('active')
        return
    }
    if (e.target.closest('.dashboard-btn')) {
        contentContainer.classList.remove('none')
        settingsContainer.classList.add('none')
        settingsBtn.classList.remove('active')
        dashboardBtn.classList.add('active')
        return
    }
})

function setCurrency() {
    const curr = main.querySelector('#currency')

    if (currency == '$') curr.value = curr[0].value
    if (currency == '€') curr.value = curr[1].value
    if (currency == '£') curr.value = curr[2].value
    if (currency == '₹') curr.value = curr[3].value
    if (currency == '¥') curr.value = curr[4].value
}

document.querySelector('.search-input').addEventListener('input', filterTransactions)
document.querySelector('#types').addEventListener('change', filterTransactions)

setCurrency()
updateChart()
filterTransactions()
updateCards()