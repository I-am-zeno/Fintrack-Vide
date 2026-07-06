const currentBalanceEl = document.getElementById('currentBalance')
const totalIncomeEl = document.getElementById('totalIncome')
const totalExpenseEl = document.getElementById('totalExpense')
const totalTransactionsEl = document.getElementById('totalTransactions')
const chartCanvas = document.getElementById('chartCanvas')
const txList = document.getElementById('txList')
const searchInput = document.getElementById('searchInput')
const typeFilter = document.getElementById('typeFilter')
const currencySelect = document.getElementById('currencySelect')
const amountSymbol = document.getElementById('amountSymbol')
const hamburger = document.getElementById('hamburger')
const navOverlay = document.getElementById('navOverlay')
const dashboardView = document.getElementById('dashboardView')
const settingsView = document.getElementById('settingsView')
const modalOverlay = document.getElementById('modalOverlay')
const modalClose = document.getElementById('modalClose')
const modalTitle = document.getElementById('modalTitle')
const txType = document.getElementById('txType')
const txDesc = document.getElementById('txDesc')
const txAmount = document.getElementById('txAmount')
const txDate = document.getElementById('txDate')
const txCategory = document.getElementById('txCategory')
const saveTx = document.getElementById('saveTx')
const addTrigger = document.getElementById('addTrigger')
const resetBtn = document.getElementById('resetBtn')
const resetBtn2 = document.getElementById('resetBtn2')
const themeToggle = document.getElementById('themeToggle')
const themeToggle2 = document.getElementById('themeToggle2')

const symMap = { 'USD ($)': '$', 'EUR (€)': '€', 'GBP (£)': '£', 'INR (₹)': '₹', 'JPY (¥)': '¥' }
const currencyIdx = { '$': 0, '€': 1, '£': 2, '₹': 3, '¥': 4 }

let myChart = null
let editingId = null
let income = 0
let expense = 0
let currency = localStorage.getItem('currency')
  ? JSON.parse(localStorage.getItem('currency'))
  : '$'

let transactions = getLocalStorage()

function updateCurrency(e) {
  const select = e.closest('#currencySelect')
  if (!select) return
  const newValue = symMap[select.value] || currency
  if (newValue === currency) return
  currency = newValue
  amountSymbol.textContent = currency
  updateCards()
  filterTransactions()
  localStorage.setItem('currency', JSON.stringify(currency))
}

function updateCards() {
  if (!transactions.length) {
    currentBalanceEl.textContent = currency + '0.00'
    totalIncomeEl.textContent = currency + '0.00'
    totalExpenseEl.textContent = currency + '0.00'
    totalTransactionsEl.textContent = '0'
    income = 0
    expense = 0
    updateChart()
    return
  }

  const totalInEx = transactions.reduce((a, { type, amount }) => {
    a[`total${type}`] = (a[`total${type}`] || 0) + Number(amount)
    return a
  }, {})

  const totalIncome = totalInEx.totalIncome || 0
  const totalExpense = totalInEx.totalExpense || 0
  const balance = totalIncome - totalExpense

  currentBalanceEl.textContent = currency + balance.toFixed(2)
  totalIncomeEl.textContent = currency + totalIncome.toFixed(2)
  totalExpenseEl.textContent = currency + totalExpense.toFixed(2)
  totalTransactionsEl.textContent = transactions.length

  income = totalIncome
  expense = totalExpense

  updateChart()
}

function renderTransactions(data) {
  const list = data || transactions
  txList.innerHTML = list.map(t => {
    const typeLower = t.type.toLowerCase()
    const sign = t.type === 'Income' ? '+' : '-'
    return `<div class="tx-row" data-type="${t.type}" data-id="${t.id}">
      <span>${t.date}</span>
      <span>${t.description}</span>
      <span><span class="tx-category">${t.category}</span></span>
      <span class="tx-amount--${typeLower}">${sign} ${currency}${t.amount}</span>
      <span class="tx-actions">
        <button class="tx-edit" data-id="${t.id}"><i class="ri-pencil-line"></i></button>
        <button class="tx-delete" data-id="${t.id}"><i class="ri-delete-bin-2-line"></i></button>
      </span>
    </div>`
  }).join('')
}

function filterTransactions() {
  const searchText = searchInput.value.toLowerCase()
  const typeValue = typeFilter.value
  const filterIncome = typeValue === 'Income Only'
  const filterExpense = typeValue === 'Expense Only'
  const filterAll = typeValue === 'All Types'

  const filtered = transactions.filter(t => {
    const matchSearch = !searchText ||
      t.description.toLowerCase().includes(searchText) ||
      t.category.toLowerCase().includes(searchText)
    const matchType = filterAll ||
      (filterIncome && t.type === 'Income') ||
      (filterExpense && t.type === 'Expense')
    return matchSearch && matchType
  })
  renderTransactions(filtered)
}

function createTransaction() {
  const type = txType.value
  const description = txDesc.value
  const amount = txAmount.value
  const date = txDate.value
  const category = txCategory.value

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
    modalTitle.textContent = 'Add Transaction'
  } else {
    transactions.unshift({ id: Date.now(), type, description, amount, date, category })
  }

  txDesc.value = ''
  txAmount.value = ''
  txDate.value = ''

  closeModal()
  setLocalStorage(transactions)
  updateCards()
  filterTransactions()
}

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id)
  if (!transaction) return

  txType.value = transaction.type
  txDesc.value = transaction.description
  txAmount.value = transaction.amount
  txDate.value = transaction.date
  txCategory.value = transaction.category
  modalTitle.textContent = 'Edit Transaction'

  editingId = id
  openModal()
}

function closeModal() {
  modalOverlay.classList.remove('open')
  txDesc.value = ''
  txAmount.value = ''
  txDate.value = ''
  modalTitle.textContent = 'Add Transaction'
  editingId = null
}

function openModal() {
  if (!txDate.value) {
    txDate.value = new Date().toISOString().split('T')[0]
  }
  modalOverlay.classList.add('open')
}

function removeTransaction(id) {
  if (!transactions.some(t => t.id === id)) return
  if (!confirm('Are you sure you want to delete this transaction?')) return

  transactions = transactions.filter(t => t.id !== id)
  setLocalStorage(transactions)
  updateCards()
  filterTransactions()
}

function reset() {
  if (transactions.length === 0) return
  if (!confirm('Are you sure you want to remove all existing data?')) return

  transactions = []
  currency = '$'
  localStorage.clear()

  currencySelect.value = currencySelect.options[0].value
  amountSymbol.textContent = currency
  updateCards()
  filterTransactions()
}

function getChartColors() {
  const style = getComputedStyle(document.body)
  return {
    text: style.getPropertyValue('--text-secondary').trim() || 'rgba(255,255,255,0.55)',
    grid: style.getPropertyValue('--border-hairline').trim() || 'rgba(255,255,255,0.04)',
    green: style.getPropertyValue('--accent-green').trim() || '#4ade80',
    red: style.getPropertyValue('--accent-red').trim() || '#f87171'
  }
}

function updateChart() {
  if (myChart) { myChart.destroy() }
  const ctx = chartCanvas.getContext('2d')
  if (!ctx) return
  const { text, grid, green, red } = getChartColors()
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Income vs Expense'],
      datasets: [
        { label: 'Income', data: [income], backgroundColor: green, borderRadius: 4 },
        { label: 'Expense', data: [expense], backgroundColor: red, borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: text, font: { family: 'Plus Jakarta Sans' } }
        }
      },
      scales: {
        x: { ticks: { color: text, font: { family: 'Plus Jakarta Sans' } }, grid: { color: grid } },
        y: { ticks: { color: text, font: { family: 'Plus Jakarta Sans' } }, grid: { color: grid } }
      }
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

function setCurrency() {
  const idx = currencyIdx[currency]
  if (idx !== undefined) {
    currencySelect.selectedIndex = idx
  }
  amountSymbol.textContent = currency
}

function setTheme(isDark) {
  document.body.classList.toggle('dark', isDark)
  themeToggle.classList.toggle('active', isDark)
  themeToggle2.classList.toggle('active', isDark)
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
  if (myChart) updateChart()
}

function toggleTheme() {
  const isDark = !document.body.classList.contains('dark')
  setTheme(isDark)
}

function initTheme() {
  const saved = localStorage.getItem('theme')
  setTheme(saved !== 'light')
}

function switchView(view) {
  dashboardView.classList.toggle('hidden', view !== 'dashboard')
  settingsView.classList.toggle('hidden', view !== 'settings')
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'))
  const activeLink = document.querySelector(`.nav-link[data-view="${view}"]`)
  if (activeLink) activeLink.classList.add('active')
  closeNav()
}

function toggleNav() {
  const isOpen = navOverlay.classList.contains('open')
  navOverlay.classList.toggle('open')
  hamburger.classList.toggle('active')
  if (!isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

function closeNav() {
  navOverlay.classList.remove('open')
  hamburger.classList.remove('active')
  document.body.style.overflow = ''
}

let revealObs = null

function scrollReveal() {
  const els = document.querySelectorAll('[data-reveal]')
  if (!els.length) return
  if (!revealObs) {
    revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          revealObs.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
  }
  els.forEach(el => revealObs.observe(el))
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(() => scrollReveal(), { timeout: 500 })
}

document.body.addEventListener('click', (e) => {
  const target = e.target

  if (target.closest('#hamburger')) {
    toggleNav()
    return
  }

  if (target.closest('#navOverlay') && !target.closest('.nav-overlay-inner')) {
    closeNav()
    return
  }

  if (target.closest('.nav-link') && !target.closest('#navOverlay .nav-link')) return

  const navLink = target.closest('#navOverlay .nav-link')
  if (navLink) {
    const view = navLink.dataset.view
    switchView(view)
    return
  }

  if (target.closest('#addTrigger')) {
    openModal()
    return
  }

  if (target.closest('#modalClose') || (target.closest('#modalOverlay') && !target.closest('.modal-bezel'))) {
    closeModal()
    return
  }

  if (target.closest('#saveTx')) {
    createTransaction()
    return
  }

  if (target.closest('.tx-edit')) {
    const id = Number(target.closest('.tx-edit').dataset.id)
    editTransaction(id)
    return
  }

  if (target.closest('.tx-delete')) {
    const id = Number(target.closest('.tx-delete').dataset.id)
    removeTransaction(id)
    return
  }

  if (target.closest('#resetBtn') || target.closest('#resetBtn2')) {
    reset()
    return
  }

  if (target.closest('#themeToggle') || target.closest('#themeToggle2')) {
    toggleTheme()
    return
  }

  if (target.closest('#currencySelect')) {
    updateCurrency(target.closest('#currencySelect'))
    return
  }
})

searchInput.addEventListener('input', filterTransactions)
typeFilter.addEventListener('change', filterTransactions)

initTheme()
setCurrency()
updateChart()
filterTransactions()
updateCards()
