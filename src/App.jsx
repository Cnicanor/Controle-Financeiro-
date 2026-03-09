import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const PRIMARY_TAB_ITEMS = [
  { id: 'home', icon: 'home' },
  { id: 'launch', icon: 'plus', isAction: true },
  { id: 'credit', icon: 'credit' },
  { id: 'menu', icon: 'menu', isMenu: true },
]

const SECONDARY_MENU_ITEMS = [
  { id: 'investments', icon: 'investments' },
  { id: 'history', icon: 'history' },
  { id: 'reports', icon: 'reports' },
]

const CATEGORY_OPTIONS = {
  receita: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
  despesa: ['Moradia', 'Alimentação', 'Transporte', 'Pet', 'Saúde', 'Lazer', 'Contas', 'Outros'],
}
const PAYMENT_METHOD_OPTIONS = Object.freeze([
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
])
const CASH_PAYMENT_METHODS = new Set(['pix', 'dinheiro', 'debito'])
const MAX_CREDIT_CARDS = 5
const SUBCATEGORY_OPTIONS = Object.freeze({
  Transporte: ['Financiamento', 'Combustível', 'Estacionamento', 'Pedágio'],
  Pet: ['Ração', 'Banho e tosa', 'Vacina'],
})

const EXPENSE_CATEGORIES = CATEGORY_OPTIONS.despesa
const INVESTMENT_ASSET_TYPES = [
  'Caixa',
  'Poupança',
  'Tesouro Direto',
  'CDB',
  'FII',
  'ETF',
  'Ação',
  'Cripto',
  'Outros',
]
const INVESTMENT_MOVEMENT_TYPES = [
  { value: 'aporte', label: 'Aporte' },
  { value: 'compra', label: 'Compra' },
  { value: 'venda', label: 'Venda' },
  { value: 'resgate', label: 'Resgate' },
  { value: 'rendimento', label: 'Rendimento' },
  { value: 'dividendo', label: 'Dividendo/Provento' },
  { value: 'transferencia', label: 'Transferência' },
]
const TRANSFER_DIRECTIONS = [
  { value: 'caixa_para_investimento', label: 'Caixa -> Investimento' },
  { value: 'investimento_para_caixa', label: 'Investimento -> Caixa' },
]
const INVESTMENT_CASH_TYPE = 'Caixa'
const DEFAULT_CASH_ASSET_ID = 'asset-caixa-principal'
const BACKUP_VERSION = 1

const STORAGE_KEYS = Object.freeze({
  entries: 'controle_financeiro_entries_v2',
  legacyEntries: 'controle_financeiro_entries_v1',
  goals: 'controle_financeiro_goals_v1',
  creditCards: 'controle_financeiro_credit_cards_v1',
  recurringRun: 'controle_financeiro_recurring_last_month',
  investmentAssets: 'controle_financeiro_investment_assets_v1',
  investmentMovements: 'controle_financeiro_investment_movements_v1',
  investmentJournal: 'controle_financeiro_investment_journal_v1',
  installGuide: 'controle_financeiro_install_guide_v1',
  theme: 'financas.theme',
  currency: 'financas.currency',
  language: 'financas.language',
})
const STORAGE_ENTRIES_KEY = STORAGE_KEYS.entries
const LEGACY_STORAGE_ENTRIES_KEY = STORAGE_KEYS.legacyEntries
const STORAGE_GOALS_KEY = STORAGE_KEYS.goals
const STORAGE_CREDIT_CARDS_KEY = STORAGE_KEYS.creditCards
const STORAGE_RECURRING_RUN_KEY = STORAGE_KEYS.recurringRun
const STORAGE_INVESTMENT_ASSETS_KEY = STORAGE_KEYS.investmentAssets
const STORAGE_INVESTMENT_MOVEMENTS_KEY = STORAGE_KEYS.investmentMovements
const STORAGE_INVESTMENT_JOURNAL_KEY = STORAGE_KEYS.investmentJournal
const STORAGE_INSTALL_GUIDE_KEY = STORAGE_KEYS.installGuide
const STORAGE_THEME_KEY = STORAGE_KEYS.theme
const STORAGE_CURRENCY_KEY = STORAGE_KEYS.currency
const STORAGE_LANGUAGE_KEY = STORAGE_KEYS.language
const TOAST_TIMEOUT_MS = 3200
const DAY_IN_MS = 24 * 60 * 60 * 1000
const INSTALL_PROMPT_SNOOZE_DAYS = 10
const THEME_OPTIONS = Object.freeze([
  { value: 'system', labelKey: 'settings.theme.system' },
  { value: 'light', labelKey: 'settings.theme.light' },
  { value: 'dark', labelKey: 'settings.theme.dark' },
])
const CURRENCY_OPTIONS = Object.freeze([
  { value: 'BRL', label: 'BRL', locale: 'pt-BR' },
  { value: 'USD', label: 'USD', locale: 'en-US' },
  { value: 'EUR', label: 'EUR', locale: 'de-DE' },
])
const LANGUAGE_OPTIONS = Object.freeze([
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'pt-PT', label: 'Português (Portugal)' },
  { value: 'en-US', label: 'English (United States)' },
])
const CURRENCY_META = Object.freeze(
  CURRENCY_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option
    return acc
  }, {}),
)
const LANGUAGE_META = Object.freeze(
  LANGUAGE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option
    return acc
  }, {}),
)
const UI_TEXT = Object.freeze({
  'pt-BR': {
    'header.eyebrow': 'Controle diário',
    'header.title': 'Meu Financeiro',
    'nav.home': 'Início',
    'nav.launch': 'Lançar',
    'nav.credit': 'Crédito',
    'nav.menu': 'Menu',
    'menu.open': 'Abrir menu',
    'menu.section': 'Áreas secundárias',
    'menu.investments': 'Investimentos',
    'menu.history': 'Histórico',
    'menu.reports': 'Relatórios',
    'menu.settings': 'Configurações',
    'menu.settings.title': 'Configurações',
    'menu.settings.back': 'Voltar',
    'settings.language': 'Idioma',
    'settings.currency': 'Moeda',
    'settings.theme': 'Tema',
    'settings.theme.system': 'Seguir sistema',
    'settings.theme.light': 'Tema claro',
    'settings.theme.dark': 'Tema escuro',
    'toast.currency': 'Moeda alterada para {value}.',
    'toast.language': 'Idioma alterado para {value}.',
    'toast.theme.system': 'Tema ajustado para seguir o sistema ({value}).',
    'toast.theme.fixed': 'Tema {value} aplicado.',
    'theme.label.light': 'claro',
    'theme.label.dark': 'escuro',
    'theme.label.system': 'sistema',
    'screen.credit.title': 'Crédito',
    'screen.credit.subtitle': 'Visão mensal',
    'screen.credit.suggestedLimit': 'Limite sugerido',
    'screen.credit.usageMonth': 'Uso no mês',
    'screen.credit.available': 'Disponível',
    'screen.credit.usageLimit': 'Uso do limite',
    'screen.credit.reference':
      'Baseado nas despesas do mês atual em relação a 30% da sua renda mensal.',
    'screen.credit.tips': 'Dicas rápidas',
    'screen.credit.tip1': 'Pague o total da fatura para evitar juros rotativos.',
    'screen.credit.tip2': 'Mantenha uso abaixo de 30% do limite para mais folga no orçamento.',
    'screen.credit.tip3': 'Concentre vencimentos próximos da data de maior entrada.',
    'screen.home.investmentsSummary': 'Investimentos (resumo)',
    'screen.home.statement': 'Extrato simplificado',
    'screen.home.recurring': 'Recorrências mensais',
    'screen.home.goalAlerts': 'Alertas de metas',
    'screen.launch.new': 'Novo lançamento',
    'screen.launch.edit': 'Editar lançamento',
    'screen.history.title': 'Histórico',
    'screen.investments.title': 'Investimentos',
    'screen.reports.title': 'Relatórios',
    'screen.reports.expensesCurrentMonth': 'Despesas por categoria (mês atual)',
  },
  'pt-PT': {
    'header.eyebrow': 'Controlo diário',
    'header.title': 'As Minhas Finanças',
    'nav.home': 'Início',
    'nav.launch': 'Lançar',
    'nav.credit': 'Crédito',
    'nav.menu': 'Menu',
    'menu.open': 'Abrir menu',
    'menu.section': 'Áreas secundárias',
    'menu.investments': 'Investimentos',
    'menu.history': 'Histórico',
    'menu.reports': 'Relatórios',
    'menu.settings': 'Configurações',
    'menu.settings.title': 'Configurações',
    'menu.settings.back': 'Voltar',
    'settings.language': 'Idioma',
    'settings.currency': 'Moeda',
    'settings.theme': 'Tema',
    'settings.theme.system': 'Seguir sistema',
    'settings.theme.light': 'Tema claro',
    'settings.theme.dark': 'Tema escuro',
    'toast.currency': 'Moeda alterada para {value}.',
    'toast.language': 'Idioma alterado para {value}.',
    'toast.theme.system': 'Tema ajustado para seguir o sistema ({value}).',
    'toast.theme.fixed': 'Tema {value} aplicado.',
    'theme.label.light': 'claro',
    'theme.label.dark': 'escuro',
    'theme.label.system': 'sistema',
    'screen.credit.title': 'Crédito',
    'screen.credit.subtitle': 'Visão mensal',
    'screen.credit.suggestedLimit': 'Limite sugerido',
    'screen.credit.usageMonth': 'Uso no mês',
    'screen.credit.available': 'Disponível',
    'screen.credit.usageLimit': 'Uso do limite',
    'screen.credit.reference':
      'Com base nas despesas do mês atual face a 30% do seu rendimento mensal.',
    'screen.credit.tips': 'Sugestões rápidas',
    'screen.credit.tip1': 'Pague o total do cartão para evitar juros de crédito rotativo.',
    'screen.credit.tip2': 'Mantenha a utilização abaixo de 30% do limite para maior folga.',
    'screen.credit.tip3': 'Concentre vencimentos perto da data de maior entrada.',
    'screen.home.investmentsSummary': 'Investimentos (resumo)',
    'screen.home.statement': 'Extrato simplificado',
    'screen.home.recurring': 'Recorrências mensais',
    'screen.home.goalAlerts': 'Alertas de metas',
    'screen.launch.new': 'Novo lançamento',
    'screen.launch.edit': 'Editar lançamento',
    'screen.history.title': 'Histórico',
    'screen.investments.title': 'Investimentos',
    'screen.reports.title': 'Relatórios',
    'screen.reports.expensesCurrentMonth': 'Despesas por categoria (mês atual)',
  },
  'en-US': {
    'header.eyebrow': 'Daily control',
    'header.title': 'My Finance',
    'nav.home': 'Home',
    'nav.launch': 'Add',
    'nav.credit': 'Credit',
    'nav.menu': 'Menu',
    'menu.open': 'Open menu',
    'menu.section': 'Secondary areas',
    'menu.investments': 'Investments',
    'menu.history': 'History',
    'menu.reports': 'Reports',
    'menu.settings': 'Settings',
    'menu.settings.title': 'Settings',
    'menu.settings.back': 'Back',
    'settings.language': 'Language',
    'settings.currency': 'Currency',
    'settings.theme': 'Theme',
    'settings.theme.system': 'Follow system',
    'settings.theme.light': 'Light theme',
    'settings.theme.dark': 'Dark theme',
    'toast.currency': 'Currency changed to {value}.',
    'toast.language': 'Language changed to {value}.',
    'toast.theme.system': 'Theme set to follow system ({value}).',
    'toast.theme.fixed': '{value} theme applied.',
    'theme.label.light': 'light',
    'theme.label.dark': 'dark',
    'theme.label.system': 'system',
    'screen.credit.title': 'Credit',
    'screen.credit.subtitle': 'Monthly view',
    'screen.credit.suggestedLimit': 'Suggested limit',
    'screen.credit.usageMonth': 'Month usage',
    'screen.credit.available': 'Available',
    'screen.credit.usageLimit': 'Limit usage',
    'screen.credit.reference':
      'Based on current month expenses against 30% of your monthly income.',
    'screen.credit.tips': 'Quick tips',
    'screen.credit.tip1': 'Pay your statement in full to avoid revolving interest.',
    'screen.credit.tip2': 'Keep usage below 30% of the limit for better cash flow.',
    'screen.credit.tip3': 'Align due dates with your main income date.',
    'screen.home.investmentsSummary': 'Investments (summary)',
    'screen.home.statement': 'Simple statement',
    'screen.home.recurring': 'Monthly recurring',
    'screen.home.goalAlerts': 'Goal alerts',
    'screen.launch.new': 'New entry',
    'screen.launch.edit': 'Edit entry',
    'screen.history.title': 'History',
    'screen.investments.title': 'Investments',
    'screen.reports.title': 'Reports',
    'screen.reports.expensesCurrentMonth': 'Expenses by category (current month)',
  },
})

function padNumber(value) {
  return String(value).padStart(2, '0')
}

function getInputDate(date = new Date()) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function getDateDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return getInputDate(date)
}

function getDisplayDate(isoDate, locale = 'pt-BR') {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(locale)
}

function isValidIsoDate(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return false
  }

  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function parseAmount(rawValue) {
  const normalized = String(rawValue ?? '').trim().replace(',', '.')
  const parsed = Number(normalized)

  if (!Number.isFinite(parsed)) {
    return NaN
  }

  return Math.round(parsed * 100) / 100
}

function createEntryId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function createCreditCardId() {
  return `card-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function createRecurringTemplateId() {
  return `rec-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function createInvestmentAssetId() {
  return `asset-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function createInvestmentMovementId() {
  return `mov-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function createInvestmentJournalId() {
  return `journal-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function getEndOfMonthIso(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const lastDay = getLastDayOfMonth(year, month)
  return `${year}-${padNumber(month)}-${padNumber(lastDay)}`
}

function getRecentMonthKeys(count = 6, referenceDate = new Date()) {
  const keys = []
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(year, month - index, 1)
    keys.push(`${date.getFullYear()}-${padNumber(date.getMonth() + 1)}`)
  }

  return keys
}

function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${padNumber(now.getMonth() + 1)}`
}

function getMonthKeyFromIsoDate(isoDate) {
  return isoDate.slice(0, 7)
}

function getMonthLabelFromKey(monthKey, locale = 'pt-BR') {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function isInCurrentMonth(isoDate) {
  return getMonthKeyFromIsoDate(isoDate) === getCurrentMonthKey()
}

function getSubcategoryOptions(category) {
  if (typeof category !== 'string') {
    return []
  }

  return SUBCATEGORY_OPTIONS[category] ?? []
}

function normalizeEntryPaymentMethod(rawPaymentMethod, type = 'despesa') {
  if (type !== 'despesa') {
    return null
  }

  return PAYMENT_METHOD_OPTIONS.some((option) => option.value === rawPaymentMethod)
    ? rawPaymentMethod
    : 'debito'
}

function normalizeEntryCreditCardId(rawCreditCardId, paymentMethod) {
  if (paymentMethod !== 'credito') {
    return null
  }

  return typeof rawCreditCardId === 'string' ? rawCreditCardId.trim() : ''
}

function resolveSelectedCreditCardId(rawCreditCardId, cardsById, cards = []) {
  const normalizedId = typeof rawCreditCardId === 'string' ? rawCreditCardId.trim() : ''
  if (normalizedId && cardsById.has(normalizedId)) {
    return normalizedId
  }

  return cards[0]?.id ?? ''
}

function normalizeEntrySubcategory(
  rawSubcategory,
  category,
  { preserveWhenNoPreset = true } = {},
) {
  const normalizedSubcategory =
    typeof rawSubcategory === 'string' ? rawSubcategory.trim() : ''

  if (!normalizedSubcategory) {
    return ''
  }

  const allowedSubcategories = getSubcategoryOptions(category)
  if (allowedSubcategories.length === 0) {
    return preserveWhenNoPreset ? normalizedSubcategory : ''
  }

  return allowedSubcategories.includes(normalizedSubcategory)
    ? normalizedSubcategory
    : ''
}

function getEntryCategoryLabel(entry) {
  if (!entry) {
    return ''
  }

  const category =
    typeof entry.category === 'string' ? entry.category.trim() : ''
  const subcategory =
    typeof entry.subcategory === 'string' ? entry.subcategory.trim() : ''

  if (!category) {
    return ''
  }

  return subcategory ? `${category} > ${subcategory}` : category
}

function getInitialForm(type = 'despesa', creditCards = []) {
  const paymentMethod = type === 'despesa' ? 'debito' : ''
  return {
    type,
    value: '',
    category: CATEGORY_OPTIONS[type][0],
    subcategory: '',
    paymentMethod,
    creditCardId:
      type === 'despesa' && paymentMethod === 'credito'
        ? creditCards[0]?.id ?? ''
        : '',
    date: getInputDate(),
    description: '',
    recurrence: 'none',
    recurrenceTemplateId: null,
  }
}

function getInitialInvestmentAssetForm(assetType = INVESTMENT_ASSET_TYPES[1]) {
  return {
    name: '',
    assetType,
    currentUnitPrice: '',
    currentTotalValue: '',
    note: '',
  }
}

function getInitialInvestmentMovementForm(assetId = DEFAULT_CASH_ASSET_ID, assetType = INVESTMENT_CASH_TYPE) {
  return {
    date: getInputDate(),
    movementType: 'aporte',
    assetId,
    assetType,
    quantity: '',
    value: '',
    note: '',
    transferDirection: 'caixa_para_investimento',
  }
}

function getInitialInvestmentJournalForm(assetId = '') {
  return {
    date: getInputDate(),
    assetId,
    note: '',
    reason: '',
    plan: '',
  }
}

function sanitizeStoredEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return null
  }

  const type = rawEntry.type === 'receita' || rawEntry.type === 'despesa' ? rawEntry.type : null
  const value = parseAmount(rawEntry.value)
  const rawCategory =
    typeof rawEntry.category === 'string' ? rawEntry.category.trim() : ''
  const hasCategoryPathFallback =
    !rawEntry.subcategory &&
    rawCategory.includes('>')
  const [fallbackCategory = '', fallbackSubcategory = ''] =
    hasCategoryPathFallback
      ? rawCategory.split('>').map((item) => item.trim())
      : [rawCategory, '']
  const category =
    fallbackCategory
      ? fallbackCategory
      : type
        ? CATEGORY_OPTIONS[type][0]
        : ''
  const subcategory = normalizeEntrySubcategory(
    rawEntry.subcategory ?? fallbackSubcategory,
    category,
    { preserveWhenNoPreset: true },
  )
  const date = typeof rawEntry.date === 'string' ? rawEntry.date : ''
  const description = typeof rawEntry.description === 'string' ? rawEntry.description.trim() : ''
  const paymentMethod = normalizeEntryPaymentMethod(rawEntry.paymentMethod, type)
  const creditCardId = normalizeEntryCreditCardId(rawEntry.creditCardId, paymentMethod)

  const rawRecurrence = rawEntry.recurrence
  const recurrence = rawRecurrence === 'monthly' ? 'monthly' : 'none'
  const recurrenceTemplateId =
    recurrence === 'monthly'
      ? typeof rawEntry.recurrenceTemplateId === 'string' && rawEntry.recurrenceTemplateId.trim()
        ? rawEntry.recurrenceTemplateId.trim()
        : createRecurringTemplateId()
      : null

  if (!type || !Number.isFinite(value) || value <= 0 || !category || !isValidIsoDate(date)) {
    return null
  }

  return {
    id:
      typeof rawEntry.id === 'string' && rawEntry.id.trim()
        ? rawEntry.id.trim()
        : createEntryId(),
    type,
    value,
    category,
    subcategory,
    date,
    description,
    paymentMethod,
    creditCardId,
    recurrence,
    recurrenceTemplateId,
  }
}

function sanitizeGoals(rawGoals) {
  if (!rawGoals || typeof rawGoals !== 'object' || Array.isArray(rawGoals)) {
    return {}
  }

  const sanitizedGoals = {}

  for (const [category, rawLimit] of Object.entries(rawGoals)) {
    if (typeof category !== 'string' || !category.trim()) {
      continue
    }

    const parsedLimit = parseAmount(rawLimit)
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      continue
    }

    sanitizedGoals[category.trim()] = parsedLimit
  }

  return sanitizedGoals
}

function sanitizeCreditCard(rawCard) {
  if (!rawCard || typeof rawCard !== 'object') {
    return null
  }

  const name = typeof rawCard.name === 'string' ? rawCard.name.trim() : ''
  const limit = parseAmount(rawCard.limit)

  if (!name || !Number.isFinite(limit) || limit <= 0) {
    return null
  }

  return {
    id:
      typeof rawCard.id === 'string' && rawCard.id.trim()
        ? rawCard.id.trim()
        : createCreditCardId(),
    name,
    limit,
  }
}

function sanitizeCreditCards(rawCards) {
  if (!Array.isArray(rawCards)) {
    return []
  }

  const seenIds = new Set()
  const sanitizedCards = []

  for (const rawCard of rawCards) {
    const sanitizedCard = sanitizeCreditCard(rawCard)
    if (!sanitizedCard || seenIds.has(sanitizedCard.id)) {
      continue
    }

    seenIds.add(sanitizedCard.id)
    sanitizedCards.push(sanitizedCard)

    if (sanitizedCards.length >= MAX_CREDIT_CARDS) {
      break
    }
  }

  return sanitizedCards
}

function createDefaultCashAsset() {
  return {
    id: DEFAULT_CASH_ASSET_ID,
    name: 'Caixa Principal',
    assetType: INVESTMENT_CASH_TYPE,
    currentUnitPrice: 1,
    currentTotalValue: null,
    note: '',
  }
}

function sanitizeInvestmentAsset(rawAsset) {
  if (!rawAsset || typeof rawAsset !== 'object') {
    return null
  }

  const assetType = INVESTMENT_ASSET_TYPES.includes(rawAsset.assetType)
    ? rawAsset.assetType
    : 'Outros'

  const name =
    typeof rawAsset.name === 'string' && rawAsset.name.trim()
      ? rawAsset.name.trim()
      : assetType === INVESTMENT_CASH_TYPE
        ? 'Caixa Principal'
        : ''

  if (!name) {
    return null
  }

  const currentUnitPrice = parseAmount(rawAsset.currentUnitPrice)
  const currentTotalValue = parseAmount(rawAsset.currentTotalValue)

  return {
    id:
      typeof rawAsset.id === 'string' && rawAsset.id.trim()
        ? rawAsset.id.trim()
        : createInvestmentAssetId(),
    name,
    assetType,
    currentUnitPrice: Number.isFinite(currentUnitPrice) && currentUnitPrice >= 0 ? currentUnitPrice : 0,
    currentTotalValue: Number.isFinite(currentTotalValue) && currentTotalValue >= 0 ? currentTotalValue : null,
    note: typeof rawAsset.note === 'string' ? rawAsset.note.trim() : '',
  }
}

function sanitizeInvestmentAssets(rawAssets) {
  if (!Array.isArray(rawAssets)) {
    return [createDefaultCashAsset()]
  }

  const sanitizedAssets = rawAssets
    .map((asset) => sanitizeInvestmentAsset(asset))
    .filter((asset) => Boolean(asset))

  if (sanitizedAssets.length === 0) {
    return [createDefaultCashAsset()]
  }

  const hasCash = sanitizedAssets.some((asset) => asset.assetType === INVESTMENT_CASH_TYPE)
  if (!hasCash) {
    sanitizedAssets.unshift(createDefaultCashAsset())
  }

  return sanitizedAssets
}

function sanitizeInvestmentMovement(rawMovement, assetsById = new Map()) {
  if (!rawMovement || typeof rawMovement !== 'object') {
    return null
  }

  const movementType = INVESTMENT_MOVEMENT_TYPES.some((item) => item.value === rawMovement.movementType)
    ? rawMovement.movementType
    : null

  const date = typeof rawMovement.date === 'string' ? rawMovement.date : ''
  const value = parseAmount(rawMovement.value)
  const quantity = parseAmount(rawMovement.quantity)
  const transferDirection = rawMovement.transferDirection

  const assetId =
    typeof rawMovement.assetId === 'string' && rawMovement.assetId.trim()
      ? rawMovement.assetId.trim()
      : DEFAULT_CASH_ASSET_ID
  const linkedAsset = assetsById.get(assetId)
  const assetType = INVESTMENT_ASSET_TYPES.includes(rawMovement.assetType)
    ? rawMovement.assetType
    : linkedAsset?.assetType ?? 'Outros'

  const requiresDirection = movementType === 'transferencia'

  if (
    !movementType ||
    !isValidIsoDate(date) ||
    !Number.isFinite(value) ||
    value <= 0 ||
    !assetId
  ) {
    return null
  }

  if (
    requiresDirection &&
    !TRANSFER_DIRECTIONS.some((option) => option.value === transferDirection)
  ) {
    return null
  }

  return {
    id:
      typeof rawMovement.id === 'string' && rawMovement.id.trim()
        ? rawMovement.id.trim()
        : createInvestmentMovementId(),
    date,
    movementType,
    assetId,
    assetType,
    quantity: Number.isFinite(quantity) && quantity >= 0 ? quantity : 0,
    value,
    note: typeof rawMovement.note === 'string' ? rawMovement.note.trim() : '',
    transferDirection: requiresDirection ? transferDirection : null,
  }
}

function sanitizeInvestmentMovements(rawMovements, assets = []) {
  if (!Array.isArray(rawMovements)) {
    return []
  }

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))

  return rawMovements
    .map((movement) => sanitizeInvestmentMovement(movement, assetsById))
    .filter((movement) => Boolean(movement))
}

function sanitizeInvestmentJournalEntry(rawEntry, assetsById = new Map()) {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return null
  }

  const date = typeof rawEntry.date === 'string' ? rawEntry.date : ''
  const note = typeof rawEntry.note === 'string' ? rawEntry.note.trim() : ''
  const reason = typeof rawEntry.reason === 'string' ? rawEntry.reason.trim() : ''
  const plan = typeof rawEntry.plan === 'string' ? rawEntry.plan.trim() : ''

  if (!isValidIsoDate(date) || !note) {
    return null
  }

  const assetId =
    typeof rawEntry.assetId === 'string' && rawEntry.assetId.trim()
      ? rawEntry.assetId.trim()
      : ''

  return {
    id:
      typeof rawEntry.id === 'string' && rawEntry.id.trim()
        ? rawEntry.id.trim()
        : createInvestmentJournalId(),
    date,
    assetId: assetId && assetsById.has(assetId) ? assetId : '',
    note,
    reason,
    plan,
  }
}

function sanitizeInvestmentJournal(rawJournalEntries, assets = []) {
  if (!Array.isArray(rawJournalEntries)) {
    return []
  }

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))

  return rawJournalEntries
    .map((entry) => sanitizeInvestmentJournalEntry(entry, assetsById))
    .filter((entry) => Boolean(entry))
}

function ensureCashAsset(assets) {
  const hasCashAsset = assets.some((asset) => asset.assetType === INVESTMENT_CASH_TYPE)
  if (hasCashAsset) {
    return assets
  }

  return [createDefaultCashAsset(), ...assets]
}

function loadEntriesFromStorage(defaultEntries) {
  const sanitizeEntries = (entries) =>
    entries
      .map((entry) => sanitizeStoredEntry(entry))
      .filter((entry) => Boolean(entry))

  if (typeof window === 'undefined') {
    return sanitizeEntries(defaultEntries)
  }

  try {
    const rawStorage =
      window.localStorage.getItem(STORAGE_ENTRIES_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_ENTRIES_KEY)

    if (!rawStorage) {
      return sanitizeEntries(defaultEntries)
    }

    const parsedStorage = JSON.parse(rawStorage)
    if (!Array.isArray(parsedStorage)) {
      return sanitizeEntries(defaultEntries)
    }

    const sanitizedEntries = sanitizeEntries(parsedStorage)

    return sanitizedEntries
  } catch {
    return sanitizeEntries(defaultEntries)
  }
}

function saveEntriesToStorage(entries) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_ENTRIES_KEY, JSON.stringify(entries))
  } catch {
    // armazenamento local indisponível; segue em memória
  }
}

function loadGoalsFromStorage() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawStorage = window.localStorage.getItem(STORAGE_GOALS_KEY)
    if (!rawStorage) {
      return {}
    }

    return sanitizeGoals(JSON.parse(rawStorage))
  } catch {
    return {}
  }
}

function saveGoalsToStorage(goals) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_GOALS_KEY, JSON.stringify(goals))
  } catch {
    // armazenamento local indisponível; segue em memória
  }
}

function loadCreditCardsFromStorage() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawStorage = window.localStorage.getItem(STORAGE_CREDIT_CARDS_KEY)
    if (!rawStorage) {
      return []
    }

    return sanitizeCreditCards(JSON.parse(rawStorage))
  } catch {
    return []
  }
}

function saveCreditCardsToStorage(cards) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_CREDIT_CARDS_KEY, JSON.stringify(cards))
  } catch {
    // armazenamento local indisponível; segue em memória
  }
}

function loadInvestmentAssetsFromStorage() {
  if (typeof window === 'undefined') {
    return [createDefaultCashAsset()]
  }

  try {
    const rawStorage = window.localStorage.getItem(STORAGE_INVESTMENT_ASSETS_KEY)
    if (!rawStorage) {
      return [createDefaultCashAsset()]
    }

    return sanitizeInvestmentAssets(JSON.parse(rawStorage))
  } catch {
    return [createDefaultCashAsset()]
  }
}

function saveInvestmentAssetsToStorage(assets) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_INVESTMENT_ASSETS_KEY, JSON.stringify(assets))
  } catch {
    // armazenamento local indisponível; segue em memória
  }
}

function loadInvestmentMovementsFromStorage(assets) {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawStorage = window.localStorage.getItem(STORAGE_INVESTMENT_MOVEMENTS_KEY)
    if (!rawStorage) {
      return []
    }

    return sanitizeInvestmentMovements(JSON.parse(rawStorage), assets)
  } catch {
    return []
  }
}

function saveInvestmentMovementsToStorage(movements) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_INVESTMENT_MOVEMENTS_KEY, JSON.stringify(movements))
  } catch {
    // armazenamento local indisponível; segue em memória
  }
}

function loadInvestmentJournalFromStorage(assets) {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawStorage = window.localStorage.getItem(STORAGE_INVESTMENT_JOURNAL_KEY)
    if (!rawStorage) {
      return []
    }

    return sanitizeInvestmentJournal(JSON.parse(rawStorage), assets)
  } catch {
    return []
  }
}

function saveInvestmentJournalToStorage(journalEntries) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_INVESTMENT_JOURNAL_KEY, JSON.stringify(journalEntries))
  } catch {
    // armazenamento local indisponível; segue em memória
  }
}

function loadLastRecurringRunMonth() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const monthKey = window.localStorage.getItem(STORAGE_RECURRING_RUN_KEY)
    return typeof monthKey === 'string' ? monthKey : null
  } catch {
    return null
  }
}

function saveLastRecurringRunMonth(monthKey) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_RECURRING_RUN_KEY, monthKey)
  } catch {
    // armazenamento local indisponível; segue sem flag de execução
  }
}

function isAppInStandaloneMode() {
  if (typeof window === 'undefined') {
    return false
  }

  const displayModeStandalone =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(display-mode: standalone)').matches
      : false

  return displayModeStandalone || window.navigator.standalone === true
}

function detectIosSafariInstallable() {
  if (typeof window === 'undefined') {
    return false
  }

  const ua = window.navigator.userAgent || ''
  const isIosDevice =
    /iPad|iPhone|iPod/i.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  const isSafariBrowser =
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|SamsungBrowser|DuckDuckGo/i.test(ua)

  return isIosDevice && isSafariBrowser
}

function normalizeThemePreference(rawTheme) {
  if (rawTheme === 'light' || rawTheme === 'dark' || rawTheme === 'system') {
    return rawTheme
  }

  return 'system'
}

function detectSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function loadThemePreference() {
  if (typeof window === 'undefined') {
    return 'system'
  }

  try {
    const rawTheme = window.localStorage.getItem(STORAGE_THEME_KEY)
    return normalizeThemePreference(rawTheme)
  } catch {
    return 'system'
  }
}

function saveThemePreference(themePreference) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_THEME_KEY, normalizeThemePreference(themePreference))
  } catch {
    // armazenamento local indisponível; segue sem persistir preferência
  }
}

function getThemeLabel(themeOption, translate) {
  if (typeof translate !== 'function') {
    return themeOption
  }

  switch (themeOption) {
    case 'light':
      return translate('theme.label.light')
    case 'dark':
      return translate('theme.label.dark')
    default:
      return translate('theme.label.system')
  }
}

function normalizeCurrencyCode(rawCurrency) {
  return CURRENCY_META[rawCurrency] ? rawCurrency : 'BRL'
}

function getCurrencyOption(currencyCode) {
  return CURRENCY_META[normalizeCurrencyCode(currencyCode)]
}

function loadCurrencyPreference() {
  if (typeof window === 'undefined') {
    return 'BRL'
  }

  try {
    const rawCurrency = window.localStorage.getItem(STORAGE_CURRENCY_KEY)
    return normalizeCurrencyCode(rawCurrency)
  } catch {
    return 'BRL'
  }
}

function saveCurrencyPreference(currencyCode) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_CURRENCY_KEY, normalizeCurrencyCode(currencyCode))
  } catch {
    // armazenamento local indisponível; segue sem persistir preferência
  }
}

function normalizeLanguageCode(rawLanguage) {
  return LANGUAGE_META[rawLanguage] ? rawLanguage : 'pt-BR'
}

function getLanguageOption(languageCode) {
  return LANGUAGE_META[normalizeLanguageCode(languageCode)]
}

function loadLanguagePreference() {
  if (typeof window === 'undefined') {
    return 'pt-BR'
  }

  try {
    const rawLanguage = window.localStorage.getItem(STORAGE_LANGUAGE_KEY)
    return normalizeLanguageCode(rawLanguage)
  } catch {
    return 'pt-BR'
  }
}

function saveLanguagePreference(languageCode) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_LANGUAGE_KEY, normalizeLanguageCode(languageCode))
  } catch {
    // armazenamento local indisponível; segue sem persistir preferência
  }
}

function createTranslate(languageCode) {
  const fallback = UI_TEXT['pt-BR']
  const active = UI_TEXT[normalizeLanguageCode(languageCode)] ?? fallback

  return (key, variables = null) => {
    const baseText = active[key] ?? fallback[key] ?? key
    if (!variables || typeof variables !== 'object') {
      return baseText
    }

    return Object.entries(variables).reduce(
      (result, [varKey, varValue]) => result.replaceAll(`{${varKey}}`, String(varValue)),
      baseText,
    )
  }
}

function loadInstallGuideState() {
  if (typeof window === 'undefined') {
    return {
      dismissedUntil: 0,
    }
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_INSTALL_GUIDE_KEY)
    if (!rawState) {
      return {
        dismissedUntil: 0,
      }
    }

    const parsedState = JSON.parse(rawState)
    const dismissedUntil = Number(parsedState.dismissedUntil)

    return {
      dismissedUntil: Number.isFinite(dismissedUntil) && dismissedUntil > 0 ? dismissedUntil : 0,
    }
  } catch {
    return {
      dismissedUntil: 0,
    }
  }
}

function saveInstallGuideState(state) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_INSTALL_GUIDE_KEY, JSON.stringify(state))
  } catch {
    // armazenamento local indisponível; segue sem persistir preferência
  }
}

function getRecurringTemplateMap(entries) {
  const templateMap = new Map()

  for (const entry of entries) {
    if (entry.recurrence !== 'monthly' || !entry.recurrenceTemplateId) {
      continue
    }

    const existingTemplate = templateMap.get(entry.recurrenceTemplateId)
    if (!existingTemplate || entry.date > existingTemplate.date) {
      templateMap.set(entry.recurrenceTemplateId, entry)
    }
  }

  return templateMap
}

function buildRecurringSummaries(entries) {
  const templateMap = getRecurringTemplateMap(entries)

  return Array.from(templateMap.values()).map((entry) => {
    const paymentMethod = normalizeEntryPaymentMethod(entry.paymentMethod, entry.type)
    return {
      templateId: entry.recurrenceTemplateId,
      type: entry.type,
      value: entry.value,
      category: entry.category,
      subcategory: entry.subcategory ?? '',
      paymentMethod,
      creditCardId: normalizeEntryCreditCardId(entry.creditCardId, paymentMethod),
      description: entry.description,
      dayOfMonth: Number(entry.date.slice(8, 10)),
    }
  })
}

function hasRecurringEntryInMonth(entries, templateId, monthKey) {
  return entries.some(
    (entry) =>
      entry.recurrence === 'monthly' &&
      entry.recurrenceTemplateId === templateId &&
      getMonthKeyFromIsoDate(entry.date) === monthKey,
  )
}

function buildRecurringEntryForMonth(templateEntry, monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const templateDay = Number(templateEntry.date.slice(8, 10))
  const day = Math.min(templateDay, getLastDayOfMonth(year, month))
  const nextDate = `${year}-${padNumber(month)}-${padNumber(day)}`
  const paymentMethod = normalizeEntryPaymentMethod(templateEntry.paymentMethod, templateEntry.type)

  return {
    id: createEntryId(),
    type: templateEntry.type,
    value: templateEntry.value,
    category: templateEntry.category,
    subcategory: templateEntry.subcategory ?? '',
    paymentMethod,
    creditCardId: normalizeEntryCreditCardId(templateEntry.creditCardId, paymentMethod),
    date: nextDate,
    description: templateEntry.description,
    recurrence: 'monthly',
    recurrenceTemplateId: templateEntry.recurrenceTemplateId,
  }
}

function generateRecurringEntriesForMonth(entries, monthKey) {
  const templateMap = getRecurringTemplateMap(entries)
  const generatedEntries = []

  for (const templateEntry of templateMap.values()) {
    const templateMonth = getMonthKeyFromIsoDate(templateEntry.date)
    if (templateMonth > monthKey) {
      continue
    }

    if (hasRecurringEntryInMonth(entries, templateEntry.recurrenceTemplateId, monthKey)) {
      continue
    }

    generatedEntries.push(buildRecurringEntryForMonth(templateEntry, monthKey))
  }

  return generatedEntries
}

function getCashAssetId(assets) {
  const cashAsset = assets.find((asset) => asset.assetType === INVESTMENT_CASH_TYPE)
  return cashAsset?.id ?? DEFAULT_CASH_ASSET_ID
}

function normalizeAssetMetric(asset) {
  return {
    ...asset,
    quantity: 0,
    costBasis: 0,
    yields: 0,
    dividends: 0,
    realizedResult: 0,
  }
}

function createFallbackAsset(assetId, assetType = 'Outros') {
  return {
    id: assetId,
    name: assetType === INVESTMENT_CASH_TYPE ? 'Caixa Principal' : 'Ativo sem cadastro',
    assetType,
    currentUnitPrice: 0,
    currentTotalValue: null,
    note: '',
    quantity: 0,
    costBasis: 0,
    yields: 0,
    dividends: 0,
    realizedResult: 0,
  }
}

function applyPositionIncrease(metric, quantity, value) {
  const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : value
  metric.quantity += normalizedQuantity
  metric.costBasis += value
}

function applyPositionReduction(metric, quantity, fallbackReductionValue = 0) {
  if (metric.quantity <= 0 || metric.costBasis <= 0) {
    const reduction = Math.min(metric.costBasis, fallbackReductionValue)
    metric.costBasis = Math.max(metric.costBasis - reduction, 0)
    return {
      soldQuantity: 0,
      removedCost: reduction,
    }
  }

  const soldQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.min(quantity, metric.quantity) : metric.quantity
  const averagePrice = metric.quantity > 0 ? metric.costBasis / metric.quantity : 0
  const removedCost = Math.min(metric.costBasis, averagePrice * soldQuantity)

  metric.quantity = Math.max(metric.quantity - soldQuantity, 0)
  metric.costBasis = Math.max(metric.costBasis - removedCost, 0)

  return {
    soldQuantity,
    removedCost,
  }
}

function calculatePortfolioFromData(
  assets,
  movements,
  { useAssetValuation = true } = {},
) {
  const normalizedAssets = ensureCashAsset(assets)
  const assetMap = new Map(normalizedAssets.map((asset) => [asset.id, normalizeAssetMetric(asset)]))
  const cashAssetId = getCashAssetId(normalizedAssets)
  const orderedMovements = [...movements].sort((a, b) => a.date.localeCompare(b.date))

  const getMetric = (assetId, assetTypeHint = 'Outros') => {
    const existingMetric = assetMap.get(assetId)
    if (existingMetric) {
      return existingMetric
    }

    const fallbackMetric = createFallbackAsset(assetId, assetTypeHint)
    assetMap.set(assetId, fallbackMetric)
    return fallbackMetric
  }

  const getCashMetric = () => getMetric(cashAssetId, INVESTMENT_CASH_TYPE)

  for (const movement of orderedMovements) {
    const targetMetric = getMetric(movement.assetId, movement.assetType)
    const cashMetric = getCashMetric()

    if (movement.movementType === 'aporte') {
      cashMetric.quantity += movement.value
      cashMetric.costBasis += movement.value
      continue
    }

    if (movement.movementType === 'compra') {
      applyPositionIncrease(targetMetric, movement.quantity, movement.value)
      if (targetMetric.id !== cashMetric.id) {
        cashMetric.quantity -= movement.value
        cashMetric.costBasis -= movement.value
      }
      continue
    }

    if (movement.movementType === 'venda') {
      const reduction = applyPositionReduction(targetMetric, movement.quantity, movement.value)
      targetMetric.realizedResult += movement.value - reduction.removedCost
      if (targetMetric.id !== cashMetric.id) {
        cashMetric.quantity += movement.value
        cashMetric.costBasis += movement.value
      }
      continue
    }

    if (movement.movementType === 'resgate') {
      const reduction = applyPositionReduction(targetMetric, movement.quantity, movement.value)
      targetMetric.realizedResult += movement.value - reduction.removedCost
      if (targetMetric.id !== cashMetric.id) {
        cashMetric.quantity += movement.value
        cashMetric.costBasis += movement.value
      }
      continue
    }

    if (movement.movementType === 'rendimento') {
      targetMetric.yields += movement.value

      if (targetMetric.assetType === INVESTMENT_CASH_TYPE) {
        targetMetric.quantity += movement.value
        targetMetric.costBasis += movement.value
      }
      continue
    }

    if (movement.movementType === 'dividendo') {
      targetMetric.dividends += movement.value
      if (targetMetric.id !== cashMetric.id) {
        cashMetric.quantity += movement.value
        cashMetric.costBasis += movement.value
      } else {
        targetMetric.quantity += movement.value
        targetMetric.costBasis += movement.value
      }
      continue
    }

    if (movement.movementType === 'transferencia') {
      if (movement.transferDirection === 'caixa_para_investimento') {
        applyPositionIncrease(targetMetric, movement.quantity, movement.value)
        if (targetMetric.id !== cashMetric.id) {
          cashMetric.quantity -= movement.value
          cashMetric.costBasis -= movement.value
        }
      } else {
        const reduction = applyPositionReduction(targetMetric, movement.quantity, movement.value)
        targetMetric.realizedResult += movement.value - reduction.removedCost
        if (targetMetric.id !== cashMetric.id) {
          cashMetric.quantity += movement.value
          cashMetric.costBasis += movement.value
        }
      }
    }
  }

  const portfolioItems = Array.from(assetMap.values()).map((metric) => {
    const appliedValue =
      metric.assetType === INVESTMENT_CASH_TYPE
        ? Math.max(metric.quantity, 0)
        : Math.max(metric.costBasis, 0)

    let currentValue = appliedValue + metric.yields

    if (
      useAssetValuation &&
      Number.isFinite(metric.currentTotalValue) &&
      metric.currentTotalValue >= 0
    ) {
      currentValue = metric.currentTotalValue
    } else if (
      useAssetValuation &&
      metric.assetType !== INVESTMENT_CASH_TYPE &&
      Number.isFinite(metric.currentUnitPrice) &&
      metric.currentUnitPrice > 0 &&
      metric.quantity > 0
    ) {
      currentValue = metric.quantity * metric.currentUnitPrice
    }

    if (metric.assetType === INVESTMENT_CASH_TYPE) {
      currentValue = Math.max(metric.quantity, 0)
    }

    const averagePrice = metric.quantity > 0 ? metric.costBasis / metric.quantity : 0
    const variation = currentValue - appliedValue
    const variationPercent = appliedValue > 0 ? (variation / appliedValue) * 100 : 0

    return {
      ...metric,
      appliedValue,
      currentValue,
      averagePrice,
      variation,
      variationPercent,
    }
  })

  const sortedItems = portfolioItems.sort((a, b) => {
    if (a.assetType === INVESTMENT_CASH_TYPE && b.assetType !== INVESTMENT_CASH_TYPE) {
      return -1
    }

    if (a.assetType !== INVESTMENT_CASH_TYPE && b.assetType === INVESTMENT_CASH_TYPE) {
      return 1
    }

    return a.name.localeCompare(b.name)
  })

  const totals = sortedItems.reduce(
    (acc, item) => {
      acc.currentTotal += item.currentValue
      acc.appliedTotal += item.appliedValue
      acc.variationTotal += item.variation

      if (item.assetType === INVESTMENT_CASH_TYPE) {
        acc.cashCurrent += item.currentValue
      } else {
        acc.investedCurrent += item.currentValue
      }

      acc.yieldsAndDividends += item.yields + item.dividends

      return acc
    },
    {
      currentTotal: 0,
      appliedTotal: 0,
      variationTotal: 0,
      investedCurrent: 0,
      cashCurrent: 0,
      yieldsAndDividends: 0,
    },
  )

  return {
    items: sortedItems,
    totals,
  }
}

function calculateInvestmentClassSummary(portfolioItems) {
  const classMap = new Map()

  for (const item of portfolioItems) {
    const classKey = item.assetType
    const existing = classMap.get(classKey) ?? {
      assetType: classKey,
      appliedValue: 0,
      currentValue: 0,
      variation: 0,
    }

    existing.appliedValue += item.appliedValue
    existing.currentValue += item.currentValue
    existing.variation += item.variation
    classMap.set(classKey, existing)
  }

  return Array.from(classMap.values())
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((item) => ({
      ...item,
      variationPercent: item.appliedValue > 0 ? (item.variation / item.appliedValue) * 100 : 0,
    }))
}

function calculateInvestmentEvolution(assets, movements, months = 6, locale = 'pt-BR') {
  const monthKeys = getRecentMonthKeys(months)

  return monthKeys.map((monthKey) => {
    const monthEnd = getEndOfMonthIso(monthKey)
    const movementsUntilMonth = movements.filter((movement) => movement.date <= monthEnd)
    const snapshot = calculatePortfolioFromData(assets, movementsUntilMonth, {
      useAssetValuation: false,
    })

    return {
      monthKey,
      label: getMonthLabelFromKey(monthKey, locale),
      currentTotal: snapshot.totals.currentTotal,
      investedCurrent: snapshot.totals.investedCurrent,
      cashCurrent: snapshot.totals.cashCurrent,
    }
  })
}

function getMovementTypeLabel(movementType) {
  return (
    INVESTMENT_MOVEMENT_TYPES.find((option) => option.value === movementType)?.label ??
    movementType
  )
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function validateFormData(formData, creditCardsById = new Map()) {
  const errors = {}

  if (formData.type !== 'receita' && formData.type !== 'despesa') {
    errors.type = 'Selecione um tipo válido.'
  }

  if (String(formData.value ?? '').trim() === '') {
    errors.value = 'Informe o valor.'
  }

  const parsedValue = parseAmount(formData.value)
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    errors.value = 'Use um valor maior que zero.'
  }

  const category =
    typeof formData.category === 'string' ? formData.category.trim() : ''
  if (!category) {
    errors.category = 'Escolha uma categoria.'
  }

  const subcategory = normalizeEntrySubcategory(formData.subcategory, category, {
    preserveWhenNoPreset: true,
  })
  const categorySuboptions = getSubcategoryOptions(category)
  if (
    categorySuboptions.length > 0 &&
    String(formData.subcategory ?? '').trim() !== '' &&
    !subcategory
  ) {
    errors.subcategory = 'Escolha uma subcategoria válida.'
  }

  const date = typeof formData.date === 'string' ? formData.date : ''
  if (!date) {
    errors.date = 'Informe a data.'
  } else if (!isValidIsoDate(date)) {
    errors.date = 'Informe uma data válida.'
  }

  const description =
    typeof formData.description === 'string' ? formData.description.trim() : ''
  if (description.length > 140) {
    errors.description = 'Descrição com até 140 caracteres.'
  }

  if (formData.recurrence !== 'none' && formData.recurrence !== 'monthly') {
    errors.recurrence = 'Escolha uma recorrência válida.'
  }

  const paymentMethod = normalizeEntryPaymentMethod(formData.paymentMethod, formData.type)
  const creditCardId = normalizeEntryCreditCardId(formData.creditCardId, paymentMethod)

  if (formData.type === 'despesa' && !paymentMethod) {
    errors.paymentMethod = 'Escolha uma forma de pagamento válida.'
  }

  if (paymentMethod === 'credito') {
    if (!creditCardId) {
      errors.creditCardId = 'Selecione um cartão de crédito.'
    } else if (creditCardsById.size > 0 && !creditCardsById.has(creditCardId)) {
      errors.creditCardId = 'Selecione um cartão de crédito válido.'
    }
  }

  return {
    errors,
    normalizedData: {
      type: formData.type,
      value: parsedValue,
      category,
      subcategory,
      date,
      description,
      paymentMethod,
      creditCardId,
      recurrence: formData.recurrence,
    },
  }
}

function validateCreditCardForm(formData) {
  const errors = {}
  const name = typeof formData.name === 'string' ? formData.name.trim() : ''
  const limit = parseAmount(formData.limit)

  if (!name) {
    errors.name = 'Informe o nome do cartão.'
  } else if (name.length > 40) {
    errors.name = 'Nome com até 40 caracteres.'
  }

  if (String(formData.limit ?? '').trim() === '') {
    errors.limit = 'Informe o limite do cartão.'
  } else if (!Number.isFinite(limit) || limit <= 0) {
    errors.limit = 'Use um limite maior que zero.'
  }

  return {
    errors,
    normalizedData: {
      name,
      limit,
    },
  }
}

function validateInvestmentAssetForm(formData) {
  const errors = {}
  const name = typeof formData.name === 'string' ? formData.name.trim() : ''
  const assetType = INVESTMENT_ASSET_TYPES.includes(formData.assetType) ? formData.assetType : null
  const currentUnitPrice = parseAmount(formData.currentUnitPrice)
  const currentTotalValue = parseAmount(formData.currentTotalValue)
  const note = typeof formData.note === 'string' ? formData.note.trim() : ''

  if (!name) {
    errors.name = 'Informe o nome do ativo.'
  }

  if (!assetType) {
    errors.assetType = 'Selecione um tipo de ativo.'
  }

  if (
    String(formData.currentUnitPrice ?? '').trim() !== '' &&
    (!Number.isFinite(currentUnitPrice) || currentUnitPrice < 0)
  ) {
    errors.currentUnitPrice = 'Informe um preço atual válido.'
  }

  if (
    String(formData.currentTotalValue ?? '').trim() !== '' &&
    (!Number.isFinite(currentTotalValue) || currentTotalValue < 0)
  ) {
    errors.currentTotalValue = 'Informe um valor atual total válido.'
  }

  return {
    errors,
    normalizedData: {
      name,
      assetType: assetType ?? 'Outros',
      currentUnitPrice:
        Number.isFinite(currentUnitPrice) && currentUnitPrice >= 0 ? currentUnitPrice : 0,
      currentTotalValue:
        Number.isFinite(currentTotalValue) && currentTotalValue >= 0 ? currentTotalValue : null,
      note,
    },
  }
}

function validateInvestmentMovementForm(formData, assetsById = new Map()) {
  const errors = {}
  const date = typeof formData.date === 'string' ? formData.date : ''
  const movementType = formData.movementType
  const assetId = typeof formData.assetId === 'string' ? formData.assetId : ''
  const value = parseAmount(formData.value)
  const quantity = parseAmount(formData.quantity)
  const note = typeof formData.note === 'string' ? formData.note.trim() : ''
  const transferDirection = formData.transferDirection
  const linkedAsset = assetsById.get(assetId)
  const assetType = INVESTMENT_ASSET_TYPES.includes(formData.assetType)
    ? formData.assetType
    : linkedAsset?.assetType ?? 'Outros'

  if (!isValidIsoDate(date)) {
    errors.date = 'Informe uma data válida.'
  }

  if (!INVESTMENT_MOVEMENT_TYPES.some((item) => item.value === movementType)) {
    errors.movementType = 'Selecione uma movimentação válida.'
  }

  if (!assetId || !linkedAsset) {
    errors.assetId = 'Selecione um ativo cadastrado.'
  }

  if (!Number.isFinite(value) || value <= 0) {
    errors.value = 'Use um valor maior que zero.'
  }

  const needsQuantity = movementType === 'compra' || movementType === 'venda'
  if (needsQuantity && (!Number.isFinite(quantity) || quantity <= 0)) {
    errors.quantity = 'Informe uma quantidade maior que zero.'
  }

  if (
    movementType === 'transferencia' &&
    !TRANSFER_DIRECTIONS.some((option) => option.value === transferDirection)
  ) {
    errors.transferDirection = 'Selecione o sentido da transferência.'
  }

  return {
    errors,
    normalizedData: {
      date,
      movementType,
      assetId,
      assetType,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
      value,
      note,
      transferDirection:
        movementType === 'transferencia' ? transferDirection : null,
    },
  }
}

function validateInvestmentJournalForm(formData, assetsById = new Map()) {
  const errors = {}
  const date = typeof formData.date === 'string' ? formData.date : ''
  const note = typeof formData.note === 'string' ? formData.note.trim() : ''
  const reason = typeof formData.reason === 'string' ? formData.reason.trim() : ''
  const plan = typeof formData.plan === 'string' ? formData.plan.trim() : ''
  const assetId =
    typeof formData.assetId === 'string' && assetsById.has(formData.assetId)
      ? formData.assetId
      : ''

  if (!isValidIsoDate(date)) {
    errors.date = 'Informe uma data válida.'
  }

  if (!note) {
    errors.note = 'Escreva uma anotação para salvar.'
  } else if (note.length > 280) {
    errors.note = 'A anotação deve ter até 280 caracteres.'
  }

  if (reason.length > 200) {
    errors.reason = 'O motivo deve ter até 200 caracteres.'
  }

  if (plan.length > 200) {
    errors.plan = 'O plano deve ter até 200 caracteres.'
  }

  return {
    errors,
    normalizedData: {
      date,
      assetId,
      note,
      reason,
      plan,
    },
  }
}

function validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, error: 'Arquivo inválido: estrutura de backup não reconhecida.' }
  }

  if (!Array.isArray(payload.entries)) {
    return { isValid: false, error: 'Arquivo inválido: lista de lançamentos ausente.' }
  }

  const sanitizedEntries = []

  for (let index = 0; index < payload.entries.length; index += 1) {
    const sanitized = sanitizeStoredEntry(payload.entries[index])
    if (!sanitized) {
      return {
        isValid: false,
        error: `Arquivo inválido: lançamento #${index + 1} está em formato incorreto.`,
      }
    }

    sanitizedEntries.push(sanitized)
  }

  if (
    payload.goals !== undefined &&
    (!payload.goals || typeof payload.goals !== 'object' || Array.isArray(payload.goals))
  ) {
    return { isValid: false, error: 'Arquivo inválido: metas devem estar em formato de objeto.' }
  }

  if (payload.creditCards !== undefined && !Array.isArray(payload.creditCards)) {
    return { isValid: false, error: 'Arquivo inválido: cartões devem estar em formato de lista.' }
  }

  if (payload.recurrences !== undefined && !Array.isArray(payload.recurrences)) {
    return { isValid: false, error: 'Arquivo inválido: recorrências devem estar em formato de lista.' }
  }

  if (
    payload.investments !== undefined &&
    (!payload.investments || typeof payload.investments !== 'object' || Array.isArray(payload.investments))
  ) {
    return { isValid: false, error: 'Arquivo inválido: bloco de investimentos em formato incorreto.' }
  }

  const rawInvestmentAssets =
    payload.investments && Array.isArray(payload.investments.assets)
      ? payload.investments.assets
      : []
  const sanitizedInvestmentAssets = sanitizeInvestmentAssets(rawInvestmentAssets)

  const rawInvestmentMovements =
    payload.investments && Array.isArray(payload.investments.movements)
      ? payload.investments.movements
      : []
  const sanitizedInvestmentMovements = sanitizeInvestmentMovements(
    rawInvestmentMovements,
    sanitizedInvestmentAssets,
  )

  const rawInvestmentJournal =
    payload.investments && Array.isArray(payload.investments.journal)
      ? payload.investments.journal
      : []
  const sanitizedInvestmentJournal = sanitizeInvestmentJournal(
    rawInvestmentJournal,
    sanitizedInvestmentAssets,
  )
  const sanitizedCreditCards = sanitizeCreditCards(payload.creditCards ?? [])

  return {
    isValid: true,
    data: {
      entries: sanitizedEntries,
      goals: sanitizeGoals(payload.goals ?? {}),
      creditCards: sanitizedCreditCards,
      recurrences:
        Array.isArray(payload.recurrences) && payload.recurrences.length > 0
          ? payload.recurrences
          : buildRecurringSummaries(sanitizedEntries),
      investments: {
        assets: sanitizedInvestmentAssets,
        movements: sanitizedInvestmentMovements,
        journal: sanitizedInvestmentJournal,
      },
      version: payload.version ?? BACKUP_VERSION,
    },
  }
}

function downloadBackupJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  const fileStamp = new Date().toISOString().replace(/[:.]/g, '-')
  link.href = url
  link.download = `financeiro-backup-${fileStamp}.json`
  window.document.body.append(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function getTypeLabel(type) {
  return type === 'receita' ? 'Receita' : 'Despesa'
}

function getPaymentMethodLabel(paymentMethod) {
  return PAYMENT_METHOD_OPTIONS.find((option) => option.value === paymentMethod)?.label ?? ''
}

function isCreditExpenseEntry(entry) {
  return entry.type === 'despesa' && entry.paymentMethod === 'credito'
}

function isCashExpenseEntry(entry) {
  return entry.type === 'despesa' && CASH_PAYMENT_METHODS.has(entry.paymentMethod)
}

function getGoalStatus(ratio) {
  if (ratio >= 1) {
    return 'over'
  }

  if (ratio >= 0.85) {
    return 'near'
  }

  return 'ok'
}

function getBootSnapshot(defaultEntries) {
  const loadedEntries = loadEntriesFromStorage(defaultEntries)
  const loadedGoals = loadGoalsFromStorage()
  const loadedCreditCards = loadCreditCardsFromStorage()
  const loadedInvestmentAssets = ensureCashAsset(loadInvestmentAssetsFromStorage())
  const loadedInvestmentMovements = loadInvestmentMovementsFromStorage(loadedInvestmentAssets)
  const loadedInvestmentJournal = loadInvestmentJournalFromStorage(loadedInvestmentAssets)
  const currentMonthKey = getCurrentMonthKey()
  const lastRunMonth = loadLastRecurringRunMonth()

  if (lastRunMonth === currentMonthKey) {
    return {
      entries: loadedEntries,
      goals: loadedGoals,
      creditCards: loadedCreditCards,
      investmentAssets: loadedInvestmentAssets,
      investmentMovements: loadedInvestmentMovements,
      investmentJournal: loadedInvestmentJournal,
      autoGeneratedCount: 0,
      shouldMarkRecurringRun: false,
    }
  }

  const generatedEntries = generateRecurringEntriesForMonth(loadedEntries, currentMonthKey)

  return {
    entries: generatedEntries.length > 0 ? [...generatedEntries, ...loadedEntries] : loadedEntries,
    goals: loadedGoals,
    creditCards: loadedCreditCards,
    investmentAssets: loadedInvestmentAssets,
    investmentMovements: loadedInvestmentMovements,
    investmentJournal: loadedInvestmentJournal,
    autoGeneratedCount: generatedEntries.length,
    shouldMarkRecurringRun: true,
  }
}

const initialEntries = [
  {
    id: '1',
    type: 'receita',
    value: 4200,
    category: 'Salário',
    date: getDateDaysAgo(7),
    description: 'Pagamento mensal',
    recurrence: 'monthly',
    recurrenceTemplateId: 'rec-salario-base',
  },
  {
    id: '2',
    type: 'despesa',
    value: 980,
    category: 'Moradia',
    date: getDateDaysAgo(5),
    description: 'Aluguel',
    recurrence: 'monthly',
    recurrenceTemplateId: 'rec-moradia-base',
  },
  {
    id: '3',
    type: 'despesa',
    value: 340,
    category: 'Alimentação',
    date: getDateDaysAgo(2),
    description: 'Supermercado',
    recurrence: 'none',
    recurrenceTemplateId: null,
  },
  {
    id: '4',
    type: 'receita',
    value: 450,
    category: 'Freelance',
    date: getDateDaysAgo(1),
    description: 'Projeto rápido',
    recurrence: 'none',
    recurrenceTemplateId: null,
  },
]

function Icon({ name, size = 18, className = '' }) {
  const baseProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
  }

  switch (name) {
    case 'home':
      return (
        <svg {...baseProps}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.9V20h5.2v-5.8h3.6V20H19V9.9" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      )
    case 'credit':
      return (
        <svg {...baseProps}>
          <rect x="3" y="6" width="18" height="12" rx="2.4" />
          <path d="M3 10.2h18" />
          <path d="M7 14h3.2" />
        </svg>
      )
    case 'history':
      return (
        <svg {...baseProps}>
          <path d="M3 12a9 9 0 1 0 2.6-6.4" />
          <path d="M3 4v4h4" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'reports':
      return (
        <svg {...baseProps}>
          <path d="M4 20h16" />
          <path d="M7 16v-5" />
          <path d="M12 16V8" />
          <path d="M17 16v-3" />
        </svg>
      )
    case 'investments':
      return (
        <svg {...baseProps}>
          <path d="M3 20h18" />
          <path d="M6 16v-4" />
          <path d="M10.5 16V8" />
          <path d="M15 16v-6" />
          <path d="M19 16v-9" />
        </svg>
      )
    case 'wallet':
      return (
        <svg {...baseProps}>
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <path d="M3 10h18" />
          <circle cx="16.5" cy="14" r="1" />
        </svg>
      )
    case 'income':
      return (
        <svg {...baseProps}>
          <path d="M5 19h14" />
          <path d="m8 13 4-4 4 4" />
          <path d="M12 9v9" />
        </svg>
      )
    case 'expense':
      return (
        <svg {...baseProps}>
          <path d="M5 19h14" />
          <path d="m8 15 4 4 4-4" />
          <path d="M12 10v9" />
        </svg>
      )
    case 'repeat':
      return (
        <svg {...baseProps}>
          <path d="M17 2v4h4" />
          <path d="M3 12a7 7 0 0 1 12-4l2 2" />
          <path d="M7 22v-4H3" />
          <path d="M21 12a7 7 0 0 1-12 4l-2-2" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...baseProps}>
          <rect x="3" y="5" width="18" height="16" rx="2.2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      )
    case 'tag':
      return (
        <svg {...baseProps}>
          <path d="M20 12.3 11.7 20.6a2.1 2.1 0 0 1-3 0L3.4 15.3a2.1 2.1 0 0 1 0-3L11.7 4H20z" />
          <circle cx="16.3" cy="7.7" r="1.2" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...baseProps}>
          <path d="m4 20 4.5-1 9.8-9.8a1.8 1.8 0 0 0 0-2.6L17.4 5a1.8 1.8 0 0 0-2.6 0L5 14.8 4 20z" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...baseProps}>
          <path d="M4 7h16" />
          <path d="M9 7V5h6v2" />
          <path d="M7 7l1 13h8l1-13" />
        </svg>
      )
    case 'target':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.6" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...baseProps}>
          <path d="M12 3 2.7 19h18.6L12 3z" />
          <path d="M12 9v4" />
          <circle cx="12" cy="16.3" r="1" />
        </svg>
      )
    case 'backup':
      return (
        <svg {...baseProps}>
          <path d="M5 19h14a2 2 0 0 0 2-2V9l-4-4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
          <path d="M17 5v4h4" />
          <path d="M8 14h8M12 10v8" />
        </svg>
      )
    case 'restore':
      return (
        <svg {...baseProps}>
          <path d="M3 12a9 9 0 1 0 2.6-6.4" />
          <path d="M3 4v4h4" />
          <path d="M12 8v5l4 2" />
        </svg>
      )
    case 'empty':
      return (
        <svg {...baseProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 10h8M8 14h5" />
        </svg>
      )
    case 'check':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.3 2.2 2.2 4.8-4.8" />
        </svg>
      )
    case 'building':
      return (
        <svg {...baseProps}>
          <path d="M4 20h16" />
          <rect x="6" y="4" width="12" height="16" rx="1.6" />
          <path d="M10 8h.01M14 8h.01M10 12h.01M14 12h.01M12 20v-3" />
        </svg>
      )
    case 'cash':
      return (
        <svg {...baseProps}>
          <rect x="3" y="6.5" width="18" height="11" rx="2" />
          <path d="M12 10v4M9.6 12h4.8" />
        </svg>
      )
    case 'diary':
      return (
        <svg {...baseProps}>
          <path d="M6 3h10a2 2 0 0 1 2 2v15H8a2 2 0 0 0-2 2z" />
          <path d="M6 3a2 2 0 0 0-2 2v15h14" />
          <path d="M10 9h5M10 13h5" />
        </svg>
      )
    case 'swap':
      return (
        <svg {...baseProps}>
          <path d="M4 7h13l-3-3" />
          <path d="m17 17H4l3 3" />
        </svg>
      )
    case 'trend':
      return (
        <svg {...baseProps}>
          <path d="M3 17 9 11l4 4 8-8" />
          <path d="M17 7h4v4" />
        </svg>
      )
    case 'filter':
      return (
        <svg {...baseProps}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      )
    case 'search':
      return (
        <svg {...baseProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      )
    case 'duplicate':
      return (
        <svg {...baseProps}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <rect x="4" y="4" width="11" height="11" rx="2" />
        </svg>
      )
    case 'pie':
      return (
        <svg {...baseProps}>
          <path d="M12 3v9h9" />
          <path d="M20.5 13a8.5 8.5 0 1 1-10-10" />
        </svg>
      )
    case 'sun':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
        </svg>
      )
    case 'moon':
      return (
        <svg {...baseProps}>
          <path d="M20 14.4A8.3 8.3 0 1 1 9.6 4a7 7 0 0 0 10.4 10.4z" />
        </svg>
      )
    case 'system':
      return (
        <svg {...baseProps}>
          <rect x="3.5" y="4.5" width="17" height="12" rx="2.2" />
          <path d="M8.5 20h7M12 16.5V20" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...baseProps}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="2.7" />
          <path d="M4.8 14.4 3 13l1.2-2.3 2-.2a6.6 6.6 0 0 1 .7-1.6L5.8 7l1.8-1.8 1.9 1.1a6.6 6.6 0 0 1 1.6-.7l.2-2h2.5l.2 2a6.6 6.6 0 0 1 1.6.7l1.9-1.1L20.2 7l-1.1 1.9c.3.5.6 1 .7 1.6l2 .2L23 13l-1.8 1.4a6.6 6.6 0 0 1-.7 1.6l1.1 1.9-1.8 1.8-1.9-1.1a6.6 6.6 0 0 1-1.6.7l-.2 2h-2.5l-.2-2a6.6 6.6 0 0 1-1.6-.7l-1.9 1.1-1.8-1.8 1.1-1.9a6.6 6.6 0 0 1-.7-1.6z" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg {...baseProps}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      )
    case 'chevron-left':
      return (
        <svg {...baseProps}>
          <path d="m15 6-6 6 6 6" />
        </svg>
      )
    case 'share':
      return (
        <svg {...baseProps}>
          <path d="M12 16V4" />
          <path d="m8 8 4-4 4 4" />
          <rect x="4" y="12" width="16" height="8" rx="2" />
        </svg>
      )
    case 'close':
      return (
        <svg {...baseProps}>
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        </svg>
      )
    default:
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}

function App() {
  const [bootSnapshot] = useState(() => getBootSnapshot(initialEntries))
  const [activeTab, setActiveTab] = useState('home')
  const [entries, setEntries] = useState(() => bootSnapshot.entries)
  const [categoryGoals, setCategoryGoals] = useState(() => bootSnapshot.goals)
  const [creditCards, setCreditCards] = useState(() => bootSnapshot.creditCards ?? [])
  const [investmentAssets, setInvestmentAssets] = useState(() =>
    ensureCashAsset(bootSnapshot.investmentAssets ?? [createDefaultCashAsset()]),
  )
  const [investmentMovements, setInvestmentMovements] = useState(
    () => bootSnapshot.investmentMovements ?? [],
  )
  const [investmentJournal, setInvestmentJournal] = useState(
    () => bootSnapshot.investmentJournal ?? [],
  )
  const [formData, setFormData] = useState(() =>
    getInitialForm('despesa', bootSnapshot.creditCards ?? []),
  )
  const [formErrors, setFormErrors] = useState({})
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [creditCardForm, setCreditCardForm] = useState({ name: '', limit: '' })
  const [creditCardErrors, setCreditCardErrors] = useState({})
  const [editingCreditCardId, setEditingCreditCardId] = useState(null)
  const [historyFilters, setHistoryFilters] = useState({
    type: 'todos',
    category: 'todas',
    subcategory: 'todas',
  })
  const [goalForm, setGoalForm] = useState({ category: EXPENSE_CATEGORIES[0], limit: '' })
  const [goalErrors, setGoalErrors] = useState({})
  const [investmentAssetForm, setInvestmentAssetForm] = useState(() =>
    getInitialInvestmentAssetForm(),
  )
  const [investmentAssetErrors, setInvestmentAssetErrors] = useState({})
  const [investmentMovementForm, setInvestmentMovementForm] = useState(() =>
    getInitialInvestmentMovementForm(),
  )
  const [investmentMovementErrors, setInvestmentMovementErrors] = useState({})
  const [investmentJournalForm, setInvestmentJournalForm] = useState(() =>
    getInitialInvestmentJournalForm(),
  )
  const [investmentJournalErrors, setInvestmentJournalErrors] = useState({})
  const [investmentFilters, setInvestmentFilters] = useState({
    assetType: 'todos',
    movementType: 'todos',
  })
  const [languageCode, setLanguageCode] = useState(() => loadLanguagePreference())
  const [themePreference, setThemePreference] = useState(() => loadThemePreference())
  const [systemTheme, setSystemTheme] = useState(() => detectSystemTheme())
  const [isSecondaryMenuOpen, setIsSecondaryMenuOpen] = useState(false)
  const [secondaryMenuSection, setSecondaryMenuSection] = useState('main')
  const [currencyCode, setCurrencyCode] = useState(() => loadCurrencyPreference())
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [launchSavedPulse, setLaunchSavedPulse] = useState(false)
  const [editingInvestmentAssetId, setEditingInvestmentAssetId] = useState(null)
  const [installGuideState, setInstallGuideState] = useState(() => loadInstallGuideState())
  const [isAppInstalled, setIsAppInstalled] = useState(() => isAppInStandaloneMode())
  const [isIosSafariInstallable, setIsIosSafariInstallable] = useState(() =>
    detectIosSafariInstallable(),
  )
  const [hasNativeInstallPrompt, setHasNativeInstallPrompt] = useState(false)
  const [pendingImport, setPendingImport] = useState(null)
  const [toast, setToast] = useState(() =>
    bootSnapshot.autoGeneratedCount > 0
      ? {
          type: 'info',
          message: `${bootSnapshot.autoGeneratedCount} lançamento(s) recorrente(s) já foram gerados para ${getMonthLabelFromKey(getCurrentMonthKey(), normalizeLanguageCode(loadLanguagePreference()))}.`,
        }
      : null,
  )

  const importInputRef = useRef(null)
  const secondaryMenuRef = useRef(null)
  const deferredInstallPromptRef = useRef(null)
  const isEditingInvestmentAsset = editingInvestmentAssetId !== null
  const isEditingCreditCard = editingCreditCardId !== null
  const isEditing = editingEntryId !== null
  const activeLanguageCode = normalizeLanguageCode(languageCode)
  const t = useMemo(() => createTranslate(activeLanguageCode), [activeLanguageCode])
  const now = new Date()
  const currentMonthKey = getCurrentMonthKey()
  const monthLabel = now.toLocaleDateString(activeLanguageCode, { month: 'long' })
  const activeCurrencyCode = normalizeCurrencyCode(currencyCode)
  const activeCurrencyOption = getCurrencyOption(activeCurrencyCode)
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(activeCurrencyOption.locale, {
        style: 'currency',
        currency: activeCurrencyCode,
      }),
    [activeCurrencyCode, activeCurrencyOption.locale],
  )
  const formatCurrency = useCallback(
    (value) => currencyFormatter.format(value),
    [currencyFormatter],
  )

  const orderedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  )

  const normalizedGlobalSearchQuery = useMemo(
    () => normalizeSearchText(globalSearchQuery),
    [globalSearchQuery],
  )

  const lastEntryByType = useMemo(
    () => ({
      receita: orderedEntries.find((entry) => entry.type === 'receita') ?? null,
      despesa: orderedEntries.find((entry) => entry.type === 'despesa') ?? null,
    }),
    [orderedEntries],
  )

  const launchCategoryShortcuts = useMemo(() => {
    const categoryMap = new Map()

    for (const entry of orderedEntries) {
      if (entry.type !== formData.type) {
        continue
      }

      const currentData = categoryMap.get(entry.category) ?? {
        count: 0,
        latestDate: '',
      }

      categoryMap.set(entry.category, {
        count: currentData.count + 1,
        latestDate: currentData.latestDate > entry.date ? currentData.latestDate : entry.date,
      })
    }

    return Array.from(categoryMap.entries())
      .sort((a, b) => {
        if (b[1].count !== a[1].count) {
          return b[1].count - a[1].count
        }

        return b[1].latestDate.localeCompare(a[1].latestDate)
      })
      .slice(0, 5)
      .map(([category]) => category)
  }, [orderedEntries, formData.type])

  const suggestedLaunchEntry = lastEntryByType[formData.type]
  const suggestedLaunchValue = suggestedLaunchEntry?.value ?? null
  const suggestedLaunchCategory = suggestedLaunchEntry?.category ?? ''
  const suggestedLaunchSubcategory = suggestedLaunchEntry?.subcategory ?? ''
  const hasLaunchSmartSuggestion = Boolean(suggestedLaunchEntry && !isEditing)
  const isLaunchValueEmpty = String(formData.value ?? '').trim() === ''
  const canSuggestLaunchValue =
    hasLaunchSmartSuggestion && Number.isFinite(suggestedLaunchValue) && isLaunchValueEmpty
  const canSuggestLaunchCategory =
    hasLaunchSmartSuggestion &&
    Boolean(suggestedLaunchCategory) &&
    (
      formData.category !== suggestedLaunchCategory ||
      formData.subcategory !== suggestedLaunchSubcategory
    )
  const canApplyFullSuggestion = canSuggestLaunchValue || canSuggestLaunchCategory
  const isInstallGuideDismissed = installGuideState.dismissedUntil > Date.now()
  const installSuggestionMode = useMemo(() => {
    if (isAppInstalled || isInstallGuideDismissed) {
      return null
    }

    if (hasNativeInstallPrompt) {
      return 'native'
    }

    if (isIosSafariInstallable) {
      return 'ios'
    }

    return null
  }, [
    hasNativeInstallPrompt,
    isAppInstalled,
    isInstallGuideDismissed,
    isIosSafariInstallable,
  ])
  const activeTheme = themePreference === 'system' ? systemTheme : themePreference

  const monthlyEntries = useMemo(
    () => entries.filter((entry) => isInCurrentMonth(entry.date)),
    [entries],
  )

  const totalBalance = useMemo(
    () =>
      entries.reduce(
        (total, entry) => {
          if (entry.type === 'receita') {
            return total + entry.value
          }

          if (isCashExpenseEntry(entry)) {
            return total - entry.value
          }

          return total
        },
        0,
      ),
    [entries],
  )

  const monthlySummary = useMemo(
    () =>
      monthlyEntries.reduce(
        (acc, entry) => {
          if (entry.type === 'receita') {
            acc.income += entry.value
          } else if (isCashExpenseEntry(entry)) {
            acc.expense += entry.value
          } else if (isCreditExpenseEntry(entry)) {
            acc.creditExpense += entry.value
          }

          return acc
        },
        { income: 0, expense: 0, creditExpense: 0 },
      ),
    [monthlyEntries],
  )

  const monthlyBalance = monthlySummary.income - monthlySummary.expense
  const savingsRate = monthlySummary.income > 0 ? (monthlyBalance / monthlySummary.income) * 100 : 0

  const monthlyExpenseTotals = useMemo(() => {
    const totals = new Map()

    for (const entry of monthlyEntries) {
      if (entry.type !== 'despesa') {
        continue
      }

      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.value)
    }

    return totals
  }, [monthlyEntries])

  const monthlyExpenseByCategory = useMemo(() => {
    const grouped = new Map()

    for (const entry of monthlyEntries) {
      if (entry.type !== 'despesa') {
        continue
      }

      const existingGroup = grouped.get(entry.category) ?? {
        category: entry.category,
        total: 0,
        subcategories: new Map(),
      }

      existingGroup.total += entry.value

      if (entry.subcategory) {
        existingGroup.subcategories.set(
          entry.subcategory,
          (existingGroup.subcategories.get(entry.subcategory) ?? 0) + entry.value,
        )
      }

      grouped.set(entry.category, existingGroup)
    }

    return Array.from(grouped.values())
      .map((group) => ({
        category: group.category,
        total: group.total,
        subcategories: Array.from(group.subcategories.entries())
          .sort((a, b) => b[1] - a[1]),
      }))
      .sort((a, b) => b.total - a.total)
  }, [monthlyEntries])

  const recurringSummaries = useMemo(() => buildRecurringSummaries(entries), [entries])
  const recurringActiveCount = recurringSummaries.length

  const goalCategoryOptions = useMemo(() => {
    const categories = new Set(EXPENSE_CATEGORIES)
    entries.forEach((entry) => {
      if (entry.type === 'despesa') {
        categories.add(entry.category)
      }
    })
    return Array.from(categories).sort((a, b) => a.localeCompare(b))
  }, [entries])

  const activeGoalCategory =
    goalCategoryOptions.length > 0 && goalCategoryOptions.includes(goalForm.category)
      ? goalForm.category
      : goalCategoryOptions[0] ?? EXPENSE_CATEGORIES[0]

  const goalProgressList = useMemo(() => {
    return Object.entries(categoryGoals)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, limit]) => {
        const spent = monthlyExpenseTotals.get(category) ?? 0
        const ratio = limit > 0 ? spent / limit : 0
        const status = getGoalStatus(ratio)
        return {
          category,
          limit,
          spent,
          ratio,
          status,
          progressWidth: Math.min(ratio * 100, 100),
          remaining: Math.max(limit - spent, 0),
          overflow: Math.max(spent - limit, 0),
        }
      })
  }, [categoryGoals, monthlyExpenseTotals])

  const goalAlerts = useMemo(
    () => goalProgressList.filter((item) => item.status === 'near' || item.status === 'over'),
    [goalProgressList],
  )

  const investmentAssetsSafe = useMemo(
    () => ensureCashAsset(investmentAssets),
    [investmentAssets],
  )

  const investmentAssetsById = useMemo(
    () => new Map(investmentAssetsSafe.map((asset) => [asset.id, asset])),
    [investmentAssetsSafe],
  )

  const portfolioSnapshot = useMemo(
    () => calculatePortfolioFromData(investmentAssetsSafe, investmentMovements),
    [investmentAssetsSafe, investmentMovements],
  )

  const portfolioItems = portfolioSnapshot.items
  const portfolioTotals = portfolioSnapshot.totals
  const investmentClassSummary = useMemo(
    () => calculateInvestmentClassSummary(portfolioItems),
    [portfolioItems],
  )

  const portfolioEvolution = useMemo(
    () =>
      calculateInvestmentEvolution(
        investmentAssetsSafe,
        investmentMovements,
        6,
        activeLanguageCode,
      ),
    [investmentAssetsSafe, investmentMovements, activeLanguageCode],
  )
  const maxEvolutionValue = useMemo(
    () => Math.max(1, ...portfolioEvolution.map((item) => item.currentTotal)),
    [portfolioEvolution],
  )

  const topInvestmentClasses = useMemo(
    () => investmentClassSummary.slice(0, 6),
    [investmentClassSummary],
  )

  const monthlyInvestmentMovements = useMemo(
    () =>
      investmentMovements.filter(
        (movement) => getMonthKeyFromIsoDate(movement.date) === currentMonthKey,
      ),
    [investmentMovements, currentMonthKey],
  )

  const monthlyInvestmentAporte = useMemo(
    () =>
      monthlyInvestmentMovements
        .filter((movement) => movement.movementType === 'aporte')
        .reduce((total, movement) => total + movement.value, 0),
    [monthlyInvestmentMovements],
  )

  const accumulatedYieldFromMovements = useMemo(
    () =>
      investmentMovements
        .filter(
          (movement) =>
            movement.movementType === 'rendimento' || movement.movementType === 'dividendo',
        )
        .reduce((total, movement) => total + movement.value, 0),
    [investmentMovements],
  )

  const investmentAssetTypeOptions = useMemo(() => {
    const types = new Set(INVESTMENT_ASSET_TYPES)
    investmentAssetsSafe.forEach((asset) => {
      types.add(asset.assetType)
    })
    return ['todos', ...Array.from(types)]
  }, [investmentAssetsSafe])

  const filteredPortfolioItems = useMemo(() => {
    if (investmentFilters.assetType === 'todos') {
      return portfolioItems
    }

    return portfolioItems.filter((item) => item.assetType === investmentFilters.assetType)
  }, [portfolioItems, investmentFilters.assetType])

  const filteredInvestmentMovements = useMemo(() => {
    return [...investmentMovements]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((movement) => {
        const matchesAssetType =
          investmentFilters.assetType === 'todos' ||
          movement.assetType === investmentFilters.assetType
        const matchesMovementType =
          investmentFilters.movementType === 'todos' ||
          movement.movementType === investmentFilters.movementType
        const movementSearchBase = normalizeSearchText(
          `${movement.date} ${movement.assetType} ${getMovementTypeLabel(movement.movementType)} ${
            investmentAssetsById.get(movement.assetId)?.name ?? ''
          } ${movement.note} ${movement.value} ${movement.quantity}`,
        )
        const matchesSearch =
          !normalizedGlobalSearchQuery ||
          movementSearchBase.includes(normalizedGlobalSearchQuery)

        return matchesAssetType && matchesMovementType && matchesSearch
      })
  }, [
    investmentMovements,
    investmentFilters,
    investmentAssetsById,
    normalizedGlobalSearchQuery,
  ])

  const sortedInvestmentJournal = useMemo(
    () => [...investmentJournal].sort((a, b) => b.date.localeCompare(a.date)),
    [investmentJournal],
  )

  const activeInvestmentMovementAssetId = investmentAssetsById.has(investmentMovementForm.assetId)
    ? investmentMovementForm.assetId
    : investmentAssetsSafe[0]?.id ?? ''

  const activeInvestmentMovementAssetType =
    investmentAssetsById.get(activeInvestmentMovementAssetId)?.assetType ??
    investmentMovementForm.assetType ??
    INVESTMENT_CASH_TYPE

  const normalizedInvestmentMovementForm = useMemo(
    () => ({
      ...investmentMovementForm,
      assetId: activeInvestmentMovementAssetId,
      assetType: activeInvestmentMovementAssetType,
    }),
    [
      investmentMovementForm,
      activeInvestmentMovementAssetId,
      activeInvestmentMovementAssetType,
    ],
  )

  const activeInvestmentJournalAssetId =
    investmentJournalForm.assetId && investmentAssetsById.has(investmentJournalForm.assetId)
      ? investmentJournalForm.assetId
      : ''

  const creditCardsById = useMemo(
    () => new Map(creditCards.map((card) => [card.id, card])),
    [creditCards],
  )

  const activeEditingCreditCard = useMemo(
    () => creditCards.find((card) => card.id === editingCreditCardId) ?? null,
    [creditCards, editingCreditCardId],
  )

  const creditCardsLimitReached = creditCards.length >= MAX_CREDIT_CARDS && !isEditingCreditCard

  const creditExpenseEntries = useMemo(
    () => orderedEntries.filter((entry) => isCreditExpenseEntry(entry)),
    [orderedEntries],
  )

  const monthlyCreditExpense = monthlySummary.creditExpense

  const creditCardSummaries = useMemo(
    () =>
      creditCards.map((card) => {
        const expenses = creditExpenseEntries.filter((entry) => entry.creditCardId === card.id)
        const totalSpent = expenses.reduce((total, entry) => total + entry.value, 0)
        const monthlySpent = expenses
          .filter((entry) => isInCurrentMonth(entry.date))
          .reduce((total, entry) => total + entry.value, 0)
        const available = card.limit - totalSpent
        const usageRatio = card.limit > 0 ? totalSpent / card.limit : 0

        return {
          ...card,
          expenses,
          totalSpent,
          monthlySpent,
          available,
          usageRatio,
          overLimit: Math.max(totalSpent - card.limit, 0),
        }
      }),
    [creditCards, creditExpenseEntries],
  )

  const creditCardsTotals = useMemo(
    () =>
      creditCardSummaries.reduce(
        (acc, card) => {
          acc.limit += card.limit
          acc.spent += card.totalSpent
          acc.available += card.available
          return acc
        },
        { limit: 0, spent: 0, available: 0 },
      ),
    [creditCardSummaries],
  )

  const creditUsageRatio =
    creditCardsTotals.limit > 0
      ? Math.min(creditCardsTotals.spent / creditCardsTotals.limit, 1.4)
      : 0

  const creditOrphanEntries = useMemo(
    () =>
      creditExpenseEntries.filter(
        (entry) => !entry.creditCardId || !creditCardsById.has(entry.creditCardId),
      ),
    [creditExpenseEntries, creditCardsById],
  )

  const historyCategoryOptions = useMemo(() => {
    const categories = new Set()

    entries.forEach((entry) => {
      if (historyFilters.type === 'todos' || entry.type === historyFilters.type) {
        categories.add(entry.category)
      }
    })

    return ['todas', ...Array.from(categories).sort((a, b) => a.localeCompare(b))]
  }, [entries, historyFilters.type])

  const activeHistoryCategory = historyCategoryOptions.includes(historyFilters.category)
    ? historyFilters.category
    : 'todas'

  const historySubcategoryOptions = useMemo(() => {
    if (activeHistoryCategory === 'todas') {
      return ['todas']
    }

    const subcategories = new Set(getSubcategoryOptions(activeHistoryCategory))

    entries.forEach((entry) => {
      if (
        (historyFilters.type === 'todos' || entry.type === historyFilters.type) &&
        entry.category === activeHistoryCategory &&
        entry.subcategory
      ) {
        subcategories.add(entry.subcategory)
      }
    })

    return ['todas', ...Array.from(subcategories).sort((a, b) => a.localeCompare(b))]
  }, [entries, historyFilters.type, activeHistoryCategory])

  const activeHistorySubcategory = historySubcategoryOptions.includes(historyFilters.subcategory)
    ? historyFilters.subcategory
    : 'todas'
  const shouldShowHistorySubcategoryFilter =
    activeHistoryCategory !== 'todas' && historySubcategoryOptions.length > 1

  const filteredHistoryEntries = useMemo(() => {
    return orderedEntries.filter((entry) => {
      const matchesType = historyFilters.type === 'todos' || entry.type === historyFilters.type
      const matchesCategory = activeHistoryCategory === 'todas' || entry.category === activeHistoryCategory
      const matchesSubcategory =
        activeHistorySubcategory === 'todas' ||
        entry.subcategory === activeHistorySubcategory
      const linkedCardName =
        entry.type === 'despesa' && entry.paymentMethod === 'credito'
          ? creditCardsById.get(entry.creditCardId ?? '')?.name ?? ''
          : ''
      const searchBase = normalizeSearchText(
        `${entry.category} ${entry.subcategory ?? ''} ${getEntryCategoryLabel(entry)} ${entry.description} ${entry.date} ${entry.value} ${getTypeLabel(entry.type)} ${getPaymentMethodLabel(entry.paymentMethod)} ${linkedCardName}`,
      )
      const matchesSearch =
        !normalizedGlobalSearchQuery ||
        searchBase.includes(normalizedGlobalSearchQuery)

      return matchesType && matchesCategory && matchesSubcategory && matchesSearch
    })
  }, [
    orderedEntries,
    historyFilters.type,
    activeHistoryCategory,
    activeHistorySubcategory,
    creditCardsById,
    normalizedGlobalSearchQuery,
  ])

  const formCategoryOptions = useMemo(() => {
    const defaults = CATEGORY_OPTIONS[formData.type] ?? CATEGORY_OPTIONS.despesa
    if (defaults.includes(formData.category) || !formData.category) {
      return defaults
    }
    return [formData.category, ...defaults]
  }, [formData.type, formData.category])

  const formSubcategoryOptions = useMemo(
    () => getSubcategoryOptions(formData.category),
    [formData.category],
  )
  const activeFormSubcategory = formSubcategoryOptions.includes(formData.subcategory)
    ? formData.subcategory
    : ''

  useEffect(() => {
    setFormData((previous) => {
      if (previous.type !== 'despesa' || previous.paymentMethod !== 'credito') {
        return previous
      }

      const selectedCreditCardId = resolveSelectedCreditCardId(
        previous.creditCardId,
        creditCardsById,
        creditCards,
      )

      if (selectedCreditCardId === previous.creditCardId) {
        return previous
      }

      return {
        ...previous,
        creditCardId: selectedCreditCardId,
      }
    })
  }, [creditCards, creditCardsById])

  useEffect(() => {
    saveEntriesToStorage(entries)
  }, [entries])

  useEffect(() => {
    saveGoalsToStorage(categoryGoals)
  }, [categoryGoals])

  useEffect(() => {
    saveCreditCardsToStorage(creditCards)
  }, [creditCards])

  useEffect(() => {
    saveInvestmentAssetsToStorage(investmentAssetsSafe)
  }, [investmentAssetsSafe])

  useEffect(() => {
    saveInvestmentMovementsToStorage(investmentMovements)
  }, [investmentMovements])

  useEffect(() => {
    saveInvestmentJournalToStorage(investmentJournal)
  }, [investmentJournal])

  useEffect(() => {
    saveInstallGuideState(installGuideState)
  }, [installGuideState])

  useEffect(() => {
    saveThemePreference(themePreference)
  }, [themePreference])

  useEffect(() => {
    saveLanguagePreference(activeLanguageCode)
  }, [activeLanguageCode])

  useEffect(() => {
    saveCurrencyPreference(activeCurrencyCode)
  }, [activeCurrencyCode])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    updateSystemTheme()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateSystemTheme)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(updateSystemTheme)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', updateSystemTheme)
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(updateSystemTheme)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.classList.remove('light', 'dark')
    document.body.classList.add(activeTheme)
    document.body.dataset.themePreference = themePreference
  }, [activeTheme, themePreference])

  useEffect(() => {
    if (!isSecondaryMenuOpen || typeof document === 'undefined') {
      return undefined
    }

    const handleOutsidePress = (event) => {
      if (secondaryMenuRef.current?.contains(event.target)) {
        return
      }

      setIsSecondaryMenuOpen(false)
      setSecondaryMenuSection('main')
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSecondaryMenuOpen(false)
        setSecondaryMenuSection('main')
      }
    }

    document.addEventListener('pointerdown', handleOutsidePress)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePress)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isSecondaryMenuOpen])

  useEffect(() => {
    if (isSecondaryMenuOpen) {
      setIsSecondaryMenuOpen(false)
      setSecondaryMenuSection('main')
    }
  }, [activeTab, isSecondaryMenuOpen])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : null

    const updateInstallContext = () => {
      setIsAppInstalled(isAppInStandaloneMode())
      setIsIosSafariInstallable(detectIosSafariInstallable())
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      deferredInstallPromptRef.current = event
      setHasNativeInstallPrompt(true)
    }

    const handleAppInstalled = () => {
      deferredInstallPromptRef.current = null
      setHasNativeInstallPrompt(false)
      setIsAppInstalled(true)
      setInstallGuideState({ dismissedUntil: Date.now() + 120 * DAY_IN_MS })
      setToast({
        type: 'success',
        message: 'App instalado. Agora você pode abrir pela tela inicial.',
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateInstallContext()
      }
    }

    updateInstallContext()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('focus', updateInstallContext)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', updateInstallContext)
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(updateInstallContext)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('focus', updateInstallContext)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', updateInstallContext)
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(updateInstallContext)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (bootSnapshot.shouldMarkRecurringRun) {
      saveLastRecurringRunMonth(getCurrentMonthKey())
    }
  }, [bootSnapshot.shouldMarkRecurringRun])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, TOAST_TIMEOUT_MS)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (!launchSavedPulse) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setLaunchSavedPulse(false)
    }, 520)

    return () => window.clearTimeout(timeoutId)
  }, [launchSavedPulse])

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  const handleToggleSecondaryMenu = () => {
    setIsSecondaryMenuOpen((previous) => {
      const next = !previous
      if (next) {
        setSecondaryMenuSection('main')
      }
      return next
    })
  }

  const handleOpenSettingsSection = () => {
    setSecondaryMenuSection('settings')
  }

  const handleBackToMainMenu = () => {
    setSecondaryMenuSection('main')
  }

  const handleSelectTheme = (nextTheme) => {
    const normalizedTheme = normalizeThemePreference(nextTheme)
    setThemePreference(normalizedTheme)
    showToast(
      'info',
      normalizedTheme === 'system'
        ? t('toast.theme.system', { value: getThemeLabel(systemTheme, t) })
        : t('toast.theme.fixed', { value: getThemeLabel(normalizedTheme, t) }),
    )
  }

  const handleSelectCurrency = (nextCurrencyCode) => {
    const normalizedCurrency = normalizeCurrencyCode(nextCurrencyCode)
    setCurrencyCode(normalizedCurrency)
    showToast('info', t('toast.currency', { value: normalizedCurrency }))
  }

  const handleSelectLanguage = (nextLanguageCode) => {
    const normalizedLanguage = normalizeLanguageCode(nextLanguageCode)
    const nextLanguageLabel = getLanguageOption(normalizedLanguage).label
    setLanguageCode(normalizedLanguage)
    showToast('info', t('toast.language', { value: nextLanguageLabel }))
  }

  const handleNavigateFromMenu = (tabId) => {
    setActiveTab(tabId)
    setIsSecondaryMenuOpen(false)
    setSecondaryMenuSection('main')
  }

  const resetLaunchForm = (type = 'despesa', cardsOverride = creditCards) => {
    setFormData(getInitialForm(type, cardsOverride))
    setFormErrors({})
    setEditingEntryId(null)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => {
      if (name === 'type') {
        const suggestedEntryForType = lastEntryByType[value]
        const suggestedCategoryForType =
          suggestedEntryForType?.category ?? CATEGORY_OPTIONS[value][0]
        const suggestedSubcategoryForType =
          suggestedEntryForType?.category === suggestedCategoryForType
            ? suggestedEntryForType?.subcategory ?? ''
            : ''
        const suggestedPaymentMethodForType =
          value === 'despesa'
            ? normalizeEntryPaymentMethod(suggestedEntryForType?.paymentMethod, value)
            : ''
        const suggestedCreditCardIdForType =
          value === 'despesa' && suggestedPaymentMethodForType === 'credito'
            ? resolveSelectedCreditCardId(
                suggestedEntryForType?.creditCardId,
                creditCardsById,
                creditCards,
              )
            : ''

        return {
          ...previous,
          type: value,
          category: suggestedCategoryForType,
          subcategory: suggestedSubcategoryForType,
          paymentMethod: suggestedPaymentMethodForType,
          creditCardId: suggestedCreditCardIdForType,
        }
      }

      if (name === 'recurrence' && value === 'none') {
        return {
          ...previous,
          recurrence: 'none',
          recurrenceTemplateId: null,
        }
      }

      if (name === 'category') {
        return {
          ...previous,
          category: value,
          subcategory: '',
        }
      }

      if (name === 'paymentMethod') {
        const nextPaymentMethod = normalizeEntryPaymentMethod(value, previous.type)
        return {
          ...previous,
          paymentMethod: nextPaymentMethod,
          creditCardId:
            nextPaymentMethod === 'credito'
              ? resolveSelectedCreditCardId(previous.creditCardId, creditCardsById, creditCards)
              : '',
        }
      }

      return {
        ...previous,
        [name]: value,
      }
    })

    setFormErrors((previous) => {
      if (!previous[name] && !(name === 'type' && previous.category)) {
        return previous
      }

      const nextErrors = { ...previous }
      delete nextErrors[name]

      if (name === 'type') {
        delete nextErrors.category
        delete nextErrors.subcategory
        delete nextErrors.paymentMethod
        delete nextErrors.creditCardId
      }

      if (name === 'category') {
        delete nextErrors.subcategory
      }

      if (name === 'paymentMethod') {
        delete nextErrors.creditCardId
      }

      return nextErrors
    })
  }

  const applyLaunchSuggestion = ({
    includeValue = false,
    includeCategory = false,
    includePayment = false,
    includeDescription = false,
    feedback = null,
  } = {}) => {
    if (!suggestedLaunchEntry || isEditing) {
      return
    }

    setFormData((previous) => {
      const nextData = { ...previous }

      if (
        includeValue &&
        Number.isFinite(suggestedLaunchValue) &&
        String(previous.value ?? '').trim() === ''
      ) {
        nextData.value = String(suggestedLaunchValue)
      }

      if (includeCategory && suggestedLaunchCategory) {
        nextData.category = suggestedLaunchCategory
        nextData.subcategory = suggestedLaunchSubcategory
      }

      if (includePayment && previous.type === 'despesa') {
        const nextPaymentMethod = normalizeEntryPaymentMethod(
          suggestedLaunchEntry.paymentMethod,
          'despesa',
        )
        nextData.paymentMethod = nextPaymentMethod
        nextData.creditCardId =
          nextPaymentMethod === 'credito'
            ? resolveSelectedCreditCardId(
                suggestedLaunchEntry.creditCardId,
                creditCardsById,
                creditCards,
              )
            : ''
      }

      if (
        includeDescription &&
        suggestedLaunchEntry.description &&
        String(previous.description ?? '').trim() === ''
      ) {
        nextData.description = suggestedLaunchEntry.description
      }

      return nextData
    })

    setFormErrors((previous) => {
      if (!previous.value && !previous.category && !previous.description) {
        return previous
      }

      const nextErrors = { ...previous }
      if (includeValue) {
        delete nextErrors.value
      }
      if (includeCategory) {
        delete nextErrors.category
        delete nextErrors.subcategory
      }
      if (includePayment) {
        delete nextErrors.paymentMethod
        delete nextErrors.creditCardId
      }
      if (includeDescription) {
        delete nextErrors.description
      }
      return nextErrors
    })

    if (feedback) {
      showToast('info', feedback)
    }
  }

  const handleUseCategoryShortcut = (category) => {
    setFormData((previous) => ({ ...previous, category, subcategory: '' }))
    setFormErrors((previous) => {
      if (!previous.category && !previous.subcategory) {
        return previous
      }
      const nextErrors = { ...previous }
      delete nextErrors.category
      delete nextErrors.subcategory
      return nextErrors
    })
  }

  const handleGlobalSearchChange = (event) => {
    setGlobalSearchQuery(event.target.value)
  }

  const handleClearGlobalSearch = () => {
    setGlobalSearchQuery('')
  }

  const dismissInstallSuggestion = (
    daysToHide = INSTALL_PROMPT_SNOOZE_DAYS,
    shouldNotify = false,
  ) => {
    setInstallGuideState({ dismissedUntil: Date.now() + daysToHide * DAY_IN_MS })

    if (shouldNotify) {
      showToast('info', 'Tudo certo. Vamos lembrar novamente em outro momento.')
    }
  }

  const handleCloseInstallSuggestion = () => {
    dismissInstallSuggestion()
  }

  const handleNativeInstallRequest = async () => {
    const deferredPrompt = deferredInstallPromptRef.current

    if (!deferredPrompt) {
      showToast('info', 'A instalação ainda não está disponível neste navegador.')
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setInstallGuideState({ dismissedUntil: Date.now() + 180 * DAY_IN_MS })
        showToast('success', 'Instalação iniciada. Finalize para adicionar à tela inicial.')
      } else {
        dismissInstallSuggestion(5, true)
      }
    } catch {
      showToast('error', 'Não foi possível abrir o instalador agora.')
    } finally {
      deferredInstallPromptRef.current = null
      setHasNativeInstallPrompt(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const { errors, normalizedData } = validateFormData(formData, creditCardsById)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showToast('error', 'Revise os campos obrigatórios para salvar.')
      return
    }

    setFormErrors({})

    const editingEntry = editingEntryId
      ? entries.find((entry) => entry.id === editingEntryId)
      : null

    const recurrenceTemplateId =
      normalizedData.recurrence === 'monthly'
        ? formData.recurrenceTemplateId ||
          editingEntry?.recurrenceTemplateId ||
          createRecurringTemplateId()
        : null

    const normalizedEntry = {
      ...normalizedData,
      recurrenceTemplateId,
    }

    if (editingEntryId) {
      setEntries((previous) =>
        previous.map((entry) =>
          entry.id === editingEntryId ? { ...entry, ...normalizedEntry } : entry,
        ),
      )

      resetLaunchForm(normalizedData.type)
      setLaunchSavedPulse(true)
      showToast('success', 'Lançamento atualizado com sucesso.')
      return
    }

    const newEntry = {
      id: createEntryId(),
      ...normalizedEntry,
    }

    setEntries((previous) => [newEntry, ...previous])
    resetLaunchForm(normalizedData.type)
    setLaunchSavedPulse(true)
    showToast('success', 'Lançamento salvo com sucesso.')
  }

  const handleStartEdit = (entry) => {
    const paymentMethod = normalizeEntryPaymentMethod(entry.paymentMethod, entry.type)
    const selectedCreditCardId =
      entry.type === 'despesa' && paymentMethod === 'credito'
        ? resolveSelectedCreditCardId(entry.creditCardId, creditCardsById, creditCards)
        : ''

    setEditingEntryId(entry.id)
    setFormData({
      type: entry.type,
      value: String(entry.value),
      category: entry.category,
      subcategory: entry.subcategory ?? '',
      paymentMethod: paymentMethod ?? '',
      creditCardId: selectedCreditCardId,
      date: entry.date,
      description: entry.description,
      recurrence: entry.recurrence,
      recurrenceTemplateId: entry.recurrenceTemplateId,
    })
    setFormErrors({})
    setActiveTab('launch')
    showToast('info', 'Lançamento carregado para edição.')
  }

  const handleCancelEdit = () => {
    resetLaunchForm()
    showToast('info', 'Edição cancelada.')
  }

  const handleRemoveEntry = (entryId) => {
    setEntries((previous) => previous.filter((entry) => entry.id !== entryId))

    if (editingEntryId === entryId) {
      resetLaunchForm()
    }

    showToast('success', 'Lançamento removido com sucesso.')
  }

  const handleDuplicateEntry = (entry) => {
    const paymentMethod = normalizeEntryPaymentMethod(entry.paymentMethod, entry.type)
    const duplicatedEntry = {
      ...entry,
      id: createEntryId(),
      date: getInputDate(),
      paymentMethod,
      creditCardId: normalizeEntryCreditCardId(entry.creditCardId, paymentMethod),
      recurrence: 'none',
      recurrenceTemplateId: null,
    }

    setEntries((previous) => [duplicatedEntry, ...previous])
    setLaunchSavedPulse(true)
    showToast('success', 'Lançamento duplicado para hoje.')
  }

  const handleGenerateRecurringForCurrentMonth = () => {
    const generatedEntries = generateRecurringEntriesForMonth(entries, currentMonthKey)

    if (generatedEntries.length === 0) {
      showToast(
        'info',
        `Nenhum lançamento recorrente pendente para ${getMonthLabelFromKey(currentMonthKey, activeLanguageCode)}.`,
      )
      return
    }

    setEntries((previous) => [...generatedEntries, ...previous])
    saveLastRecurringRunMonth(currentMonthKey)
    showToast(
      'success',
      `${generatedEntries.length} lançamento(s) recorrente(s) gerado(s) para ${getMonthLabelFromKey(currentMonthKey, activeLanguageCode)}.`,
    )
  }

  const handleHistoryFilterChange = (event) => {
    const { name, value } = event.target
    setHistoryFilters((previous) => {
      if (name === 'type') {
        return { type: value, category: 'todas', subcategory: 'todas' }
      }

      if (name === 'category') {
        return { ...previous, category: value, subcategory: 'todas' }
      }

      return { ...previous, [name]: value }
    })
  }

  const handleGoalChange = (event) => {
    const { name, value } = event.target
    setGoalForm((previous) => ({ ...previous, [name]: value }))
    setGoalErrors((previous) => {
      if (!previous[name]) {
        return previous
      }

      const nextErrors = { ...previous }
      delete nextErrors[name]
      return nextErrors
    })
  }

  const handleSaveGoal = (event) => {
    event.preventDefault()

    const errors = {}
    const category = activeGoalCategory
    const limit = parseAmount(goalForm.limit)

    if (!category) {
      errors.category = 'Escolha uma categoria.'
    }

    if (String(goalForm.limit ?? '').trim() === '') {
      errors.limit = 'Informe o limite mensal.'
    } else if (!Number.isFinite(limit) || limit <= 0) {
      errors.limit = 'Use um limite maior que zero.'
    }

    if (Object.keys(errors).length > 0) {
      setGoalErrors(errors)
      showToast('error', 'Revise os dados da meta antes de salvar.')
      return
    }

    setGoalErrors({})
    setCategoryGoals((previous) => ({ ...previous, [category]: limit }))
    setGoalForm((previous) => ({ ...previous, category, limit: '' }))
    showToast('success', `Meta mensal de ${category} salva com sucesso.`)
  }

  const handleRemoveGoal = (category) => {
    setCategoryGoals((previous) => {
      const next = { ...previous }
      delete next[category]
      return next
    })
    showToast('success', `Meta de ${category} removida.`)
  }

  const resetCreditCardForm = () => {
    setCreditCardForm({ name: '', limit: '' })
    setCreditCardErrors({})
    setEditingCreditCardId(null)
  }

  const handleCreditCardChange = (event) => {
    const { name, value } = event.target
    setCreditCardForm((previous) => ({ ...previous, [name]: value }))

    setCreditCardErrors((previous) => {
      if (!previous[name]) {
        return previous
      }

      const nextErrors = { ...previous }
      delete nextErrors[name]
      return nextErrors
    })
  }

  const handleSaveCreditCard = (event) => {
    event.preventDefault()

    if (creditCardsLimitReached) {
      showToast('error', `Você atingiu o limite de ${MAX_CREDIT_CARDS} cartões.`)
      return
    }

    const { errors, normalizedData } = validateCreditCardForm(creditCardForm)
    if (Object.keys(errors).length > 0) {
      setCreditCardErrors(errors)
      showToast('error', 'Revise os dados do cartão antes de salvar.')
      return
    }

    const duplicatedName = creditCards.some(
      (card) =>
        card.name.toLowerCase() === normalizedData.name.toLowerCase() &&
        card.id !== editingCreditCardId,
    )
    if (duplicatedName) {
      setCreditCardErrors({ name: 'Já existe um cartão com esse nome.' })
      showToast('error', 'Nome de cartão já cadastrado.')
      return
    }

    if (isEditingCreditCard && activeEditingCreditCard) {
      setCreditCards((previous) =>
        previous.map((card) =>
          card.id === editingCreditCardId ? { ...card, ...normalizedData } : card,
        ),
      )
      resetCreditCardForm()
      showToast('success', 'Cartão atualizado com sucesso.')
      return
    }

    setCreditCards((previous) => [
      ...previous,
      { id: createCreditCardId(), ...normalizedData },
    ])
    resetCreditCardForm()
    showToast('success', 'Cartão cadastrado com sucesso.')
  }

  const handleStartEditCreditCard = (card) => {
    setEditingCreditCardId(card.id)
    setCreditCardForm({
      name: card.name,
      limit: String(card.limit),
    })
    setCreditCardErrors({})
  }

  const handleCancelEditCreditCard = () => {
    resetCreditCardForm()
  }

  const resetInvestmentAssetForm = (assetType = INVESTMENT_ASSET_TYPES[1]) => {
    setInvestmentAssetForm(getInitialInvestmentAssetForm(assetType))
    setInvestmentAssetErrors({})
    setEditingInvestmentAssetId(null)
  }

  const resetInvestmentMovementForm = (assetId = getCashAssetId(investmentAssetsSafe)) => {
    const linkedAsset = investmentAssetsById.get(assetId)
    setInvestmentMovementForm(
      getInitialInvestmentMovementForm(assetId, linkedAsset?.assetType ?? INVESTMENT_CASH_TYPE),
    )
    setInvestmentMovementErrors({})
  }

  const resetInvestmentJournalForm = () => {
    setInvestmentJournalForm(getInitialInvestmentJournalForm())
    setInvestmentJournalErrors({})
  }

  const handleInvestmentAssetChange = (event) => {
    const { name, value } = event.target
    setInvestmentAssetForm((previous) => ({ ...previous, [name]: value }))

    setInvestmentAssetErrors((previous) => {
      if (!previous[name]) {
        return previous
      }

      const nextErrors = { ...previous }
      delete nextErrors[name]
      return nextErrors
    })
  }

  const handleSaveInvestmentAsset = (event) => {
    event.preventDefault()

    const { errors, normalizedData } = validateInvestmentAssetForm(investmentAssetForm)
    if (Object.keys(errors).length > 0) {
      setInvestmentAssetErrors(errors)
      showToast('error', 'Revise os dados do ativo antes de salvar.')
      return
    }

    setInvestmentAssetErrors({})

    if (isEditingInvestmentAsset) {
      setInvestmentAssets((previous) =>
        previous.map((asset) =>
          asset.id === editingInvestmentAssetId
            ? {
                ...asset,
                ...normalizedData,
                assetType:
                  asset.id === getCashAssetId(previous)
                    ? INVESTMENT_CASH_TYPE
                    : normalizedData.assetType,
              }
            : asset,
        ),
      )
      resetInvestmentAssetForm(normalizedData.assetType)
      showToast('success', 'Ativo atualizado com sucesso.')
      return
    }

    const nextAsset = {
      id: createInvestmentAssetId(),
      ...normalizedData,
    }

    setInvestmentAssets((previous) => ensureCashAsset([...previous, nextAsset]))
    resetInvestmentAssetForm(normalizedData.assetType)
    showToast('success', 'Ativo adicionado à carteira.')
  }

  const handleStartEditInvestmentAsset = (asset) => {
    setEditingInvestmentAssetId(asset.id)
    setInvestmentAssetForm({
      name: asset.name,
      assetType: asset.assetType,
      currentUnitPrice: asset.currentUnitPrice > 0 ? String(asset.currentUnitPrice) : '',
      currentTotalValue:
        Number.isFinite(asset.currentTotalValue) && asset.currentTotalValue >= 0
          ? String(asset.currentTotalValue)
          : '',
      note: asset.note ?? '',
    })
    setInvestmentAssetErrors({})
  }

  const handleCancelEditInvestmentAsset = () => {
    resetInvestmentAssetForm()
  }

  const handleRemoveInvestmentAsset = (assetId) => {
    const isCashAsset = investmentAssetsById.get(assetId)?.assetType === INVESTMENT_CASH_TYPE
    if (isCashAsset) {
      showToast('error', 'O ativo de caixa principal não pode ser removido.')
      return
    }

    const hasMovements = investmentMovements.some((movement) => movement.assetId === assetId)
    if (hasMovements) {
      showToast('error', 'Remova as movimentações desse ativo antes de excluí-lo.')
      return
    }

    setInvestmentAssets((previous) => previous.filter((asset) => asset.id !== assetId))
    setInvestmentJournal((previous) => previous.filter((entry) => entry.assetId !== assetId))
    showToast('success', 'Ativo removido com sucesso.')
  }

  const handleInvestmentMovementChange = (event) => {
    const { name, value } = event.target

    setInvestmentMovementForm((previous) => {
      if (name === 'assetId') {
        const selectedAsset = investmentAssetsById.get(value)
        return {
          ...previous,
          assetId: value,
          assetType: selectedAsset?.assetType ?? previous.assetType,
        }
      }

      if (name === 'movementType') {
        const cashAssetId = getCashAssetId(investmentAssetsSafe)
        if (value === 'aporte') {
          const cashAsset = investmentAssetsById.get(cashAssetId)
          return {
            ...previous,
            movementType: value,
            assetId: cashAssetId,
            assetType: cashAsset?.assetType ?? INVESTMENT_CASH_TYPE,
          }
        }

        return {
          ...previous,
          movementType: value,
        }
      }

      return {
        ...previous,
        [name]: value,
      }
    })

    setInvestmentMovementErrors((previous) => {
      if (!previous[name]) {
        return previous
      }

      const nextErrors = { ...previous }
      delete nextErrors[name]
      return nextErrors
    })
  }

  const handleSaveInvestmentMovement = (event) => {
    event.preventDefault()

    const { errors, normalizedData } = validateInvestmentMovementForm(
      normalizedInvestmentMovementForm,
      investmentAssetsById,
    )

    if (Object.keys(errors).length > 0) {
      setInvestmentMovementErrors(errors)
      showToast('error', 'Revise os dados da movimentação antes de salvar.')
      return
    }

    setInvestmentMovementErrors({})
    setInvestmentMovements((previous) => [
      { id: createInvestmentMovementId(), ...normalizedData },
      ...previous,
    ])
    resetInvestmentMovementForm(normalizedData.assetId)
    showToast('success', 'Movimentação de investimento registrada.')
  }

  const handleRemoveInvestmentMovement = (movementId) => {
    setInvestmentMovements((previous) =>
      previous.filter((movement) => movement.id !== movementId),
    )
    showToast('success', 'Movimentação removida com sucesso.')
  }

  const handleInvestmentJournalChange = (event) => {
    const { name, value } = event.target
    setInvestmentJournalForm((previous) => ({ ...previous, [name]: value }))

    setInvestmentJournalErrors((previous) => {
      if (!previous[name]) {
        return previous
      }

      const nextErrors = { ...previous }
      delete nextErrors[name]
      return nextErrors
    })
  }

  const handleSaveInvestmentJournal = (event) => {
    event.preventDefault()

    const normalizedJournalForm = {
      ...investmentJournalForm,
      assetId: activeInvestmentJournalAssetId,
    }

    const { errors, normalizedData } = validateInvestmentJournalForm(
      normalizedJournalForm,
      investmentAssetsById,
    )
    if (Object.keys(errors).length > 0) {
      setInvestmentJournalErrors(errors)
      showToast('error', 'Revise a anotação antes de salvar.')
      return
    }

    setInvestmentJournalErrors({})
    setInvestmentJournal((previous) => [
      { id: createInvestmentJournalId(), ...normalizedData },
      ...previous,
    ])
    resetInvestmentJournalForm()
    showToast('success', 'Anotação adicionada ao diário de investimentos.')
  }

  const handleRemoveInvestmentJournal = (journalId) => {
    setInvestmentJournal((previous) => previous.filter((entry) => entry.id !== journalId))
    showToast('success', 'Anotação removida do diário.')
  }

  const handleInvestmentFilterChange = (event) => {
    const { name, value } = event.target
    setInvestmentFilters((previous) => ({ ...previous, [name]: value }))
  }

  const handleExportBackup = () => {
    try {
      const payload = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        entries,
        goals: categoryGoals,
        creditCards,
        recurrences: recurringSummaries,
        investments: {
          assets: investmentAssetsSafe,
          movements: investmentMovements,
          journal: investmentJournal,
        },
      }

      downloadBackupJson(payload)
      showToast('success', 'Backup exportado com sucesso.')
    } catch {
      showToast('error', 'Não foi possível exportar o backup agora.')
    }
  }

  const handleRequestImport = () => {
    importInputRef.current?.click()
  }

  const handleImportBackup = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const fileContent = await file.text()
      const parsedPayload = JSON.parse(fileContent)
      const validation = validateBackupPayload(parsedPayload)

      if (!validation.isValid) {
        showToast('error', validation.error)
        return
      }

      setPendingImport({
        fileName: file.name,
        summary: {
          entriesCount: validation.data.entries.length,
          goalsCount: Object.keys(validation.data.goals).length,
          creditCardsCount: validation.data.creditCards.length,
          recurringCount: validation.data.recurrences.length,
          investmentAssetsCount: validation.data.investments.assets.length,
          investmentMovementsCount: validation.data.investments.movements.length,
          investmentJournalCount: validation.data.investments.journal.length,
          version: validation.data.version,
        },
        data: validation.data,
      })
      showToast('info', 'Backup validado. Confirme para restaurar os dados.')
    } catch {
      showToast('error', 'Falha ao ler o arquivo. Verifique se é um JSON válido.')
    }
  }

  const handleConfirmImport = () => {
    if (!pendingImport) {
      return
    }

    setEntries(pendingImport.data.entries)
    setCategoryGoals(pendingImport.data.goals)
    setCreditCards(pendingImport.data.creditCards)
    setInvestmentAssets(ensureCashAsset(pendingImport.data.investments.assets))
    setInvestmentMovements(pendingImport.data.investments.movements)
    setInvestmentJournal(pendingImport.data.investments.journal)
    setPendingImport(null)
    resetLaunchForm('despesa', pendingImport.data.creditCards)
    resetCreditCardForm()
    resetInvestmentAssetForm()
    resetInvestmentMovementForm()
    resetInvestmentJournalForm()
    setHistoryFilters({ type: 'todos', category: 'todas', subcategory: 'todas' })
    setInvestmentFilters({ assetType: 'todos', movementType: 'todos' })
    setActiveTab('home')
    saveLastRecurringRunMonth(getCurrentMonthKey())
    showToast('success', 'Backup restaurado com sucesso.')
  }

  const handleCancelImport = () => {
    setPendingImport(null)
    showToast('info', 'Restauração cancelada. Nenhum dado foi alterado.')
  }

  return (
    <div className="app-shell">
      {toast && (
        <aside className={`toast ${toast.type}`} role="status" aria-live="polite">
          <div className="toast-content">
            <Icon name={toast.type === 'error' ? 'alert' : 'check'} size={16} />
            <span>{toast.message}</span>
          </div>
        </aside>
      )}

      <main className="app-content">
        <header className="top-header">
          <div className="top-header-main">
            <div className="top-header-info">
              <p className="eyebrow">{t('header.eyebrow')}</p>
              <h1>{t('header.title')}</h1>
              <p className="header-date">
                {now.toLocaleDateString(activeLanguageCode, {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        </header>

        {activeTab === 'home' && (
          <section className="screen">
            {installSuggestionMode && (
              <article className={`install-banner ${installSuggestionMode}`}>
                <div className="install-banner-head">
                  <h3>
                    <Icon
                      name={installSuggestionMode === 'ios' ? 'share' : 'plus'}
                      size={16}
                      className="heading-icon"
                    />
                    {installSuggestionMode === 'ios'
                      ? 'Adicionar à tela inicial'
                      : 'Instalar aplicativo'}
                  </h3>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={handleCloseInstallSuggestion}
                    aria-label="Dispensar sugestão de instalação"
                  >
                    <Icon name="close" size={15} />
                  </button>
                </div>

                {installSuggestionMode === 'native' ? (
                  <>
                    <p>
                      Instale o app para abrir direto como aplicativo e acessar seu controle mais
                      rápido no dia a dia.
                    </p>
                    <div className="install-actions">
                      <button className="primary-button" type="button" onClick={handleNativeInstallRequest}>
                        <Icon name="check" size={16} />
                        Instalar agora
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => dismissInstallSuggestion(INSTALL_PROMPT_SNOOZE_DAYS, true)}
                      >
                        Agora não
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      No iPhone, abra este app no Safari e siga os passos para fixar na tela
                      inicial.
                    </p>
                    <ol className="install-steps">
                      <li>Toque no botão Compartilhar do Safari.</li>
                      <li>Escolha “Adicionar à Tela de Início”.</li>
                      <li>Confirme em “Adicionar”.</li>
                    </ol>
                    <div className="install-actions">
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => dismissInstallSuggestion(INSTALL_PROMPT_SNOOZE_DAYS, true)}
                      >
                        Entendi
                      </button>
                    </div>
                  </>
                )}
              </article>
            )}

            <article className="balance-card">
              <div className="balance-head">
                <p className="section-label">Saldo disponível em caixa</p>
                <Icon name="wallet" />
              </div>
              <h2 className="main-balance">{formatCurrency(totalBalance)}</h2>
              <p className={`balance-trend ${monthlyBalance >= 0 ? 'positive' : 'negative'}`}>
                Saldo de {monthLabel}: {monthlyBalance >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(monthlyBalance))}
              </p>
            </article>

            <div className="metrics-grid">
              <article className="metric-card income">
                <div className="metric-top">
                  <p>Receitas do mês</p>
                  <Icon name="income" size={16} />
                </div>
                <strong>{formatCurrency(monthlySummary.income)}</strong>
              </article>
              <article className="metric-card expense">
                <div className="metric-top">
                  <p>Despesas do mês</p>
                  <Icon name="expense" size={16} />
                </div>
                <strong>{formatCurrency(monthlySummary.expense)}</strong>
              </article>
              <article className="metric-card">
                <div className="metric-top">
                  <p>Despesas no crédito</p>
                  <Icon name="credit" size={16} />
                </div>
                <strong>{formatCurrency(monthlyCreditExpense)}</strong>
              </article>
              <article className="metric-card">
                <div className="metric-top">
                  <p>Saldo do mês</p>
                  <Icon name="reports" size={16} />
                </div>
                <strong className={monthlyBalance >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(monthlyBalance)}
                </strong>
              </article>
            </div>

            <article className="panel">
              <div className="panel-heading">
                <h3>
                  <Icon name="investments" size={16} className="heading-icon" />
                  {t('screen.home.investmentsSummary')}
                </h3>
                <span>{portfolioItems.length} ativos</span>
              </div>

              <div className="summary-grid investments-quick-grid">
                <div className="summary-item">
                  <p>Patrimônio investido</p>
                  <strong>{formatCurrency(portfolioTotals.investedCurrent)}</strong>
                </div>
                <div className="summary-item">
                  <p>Rendimento acumulado</p>
                  <strong className={portfolioTotals.variationTotal >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(accumulatedYieldFromMovements)}
                  </strong>
                </div>
              </div>

              <div className="inline-action-row">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setActiveTab('investments')}
                >
                  <Icon name="investments" size={16} />
                  Ver módulo de investimentos
                </button>
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>{t('screen.home.statement')}</h3>
                <span>{orderedEntries.length} movimentações</span>
              </div>

              {orderedEntries.length === 0 ? (
                <div className="empty-state">
                  <Icon name="history" />
                  <p>Nenhuma movimentação financeira registrada.</p>
                  <small>As receitas e despesas mais recentes aparecerão aqui como extrato.</small>
                </div>
              ) : (
                <ul className="entry-list full">
                  {orderedEntries.slice(0, 8).map((entry) => (
                    <li key={entry.id} className="entry-item">
                      <div className="entry-main">
                        <p className="entry-title">{getEntryCategoryLabel(entry)}</p>
                        <div className="entry-meta">
                          <small>{getDisplayDate(entry.date, activeLanguageCode)}</small>
                          <span className={`type-pill ${entry.type}`}>{getTypeLabel(entry.type)}</span>
                          {entry.recurrence === 'monthly' && (
                            <span className="tag-pill recurring">
                              <Icon name="repeat" size={12} />
                              Mensal
                            </span>
                          )}
                          {entry.type === 'despesa' && entry.paymentMethod && (
                            <span className="tag-pill payment-method">
                              <Icon
                                name={entry.paymentMethod === 'credito' ? 'credit' : 'wallet'}
                                size={12}
                              />
                              {getPaymentMethodLabel(entry.paymentMethod)}
                            </span>
                          )}
                          {entry.type === 'despesa' && entry.paymentMethod === 'credito' && (
                            <span className="tag-pill credit-card">
                              <Icon name="credit" size={12} />
                              {creditCardsById.get(entry.creditCardId ?? '')?.name ?? 'Sem cartão'}
                            </span>
                          )}
                        </div>
                        {entry.description && <small>{entry.description}</small>}
                      </div>
                      <strong className={entry.type === 'receita' ? 'positive' : 'negative'}>
                        {entry.type === 'receita' ? '+' : '-'}
                        {formatCurrency(entry.value)}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>{t('screen.home.recurring')}</h3>
                <span>{recurringActiveCount} ativas</span>
              </div>

              <p className="section-note">
                Gere lançamentos recorrentes do mês atual sem duplicar os já existentes.
              </p>
              <button
                className="primary-button"
                type="button"
                onClick={handleGenerateRecurringForCurrentMonth}
              >
                <Icon name="repeat" size={16} />
                Gerar recorrentes de {monthLabel}
              </button>
            </article>

            {goalAlerts.length > 0 && (
              <article className="panel warning-panel">
                <div className="panel-heading">
                  <h3>{t('screen.home.goalAlerts')}</h3>
                  <span>{goalAlerts.length} categoria(s)</span>
                </div>
                <ul className="goal-alert-list">
                  {goalAlerts.map((goal) => (
                    <li key={goal.category}>
                      <Icon name="alert" size={14} />
                      <span>
                        <strong>{goal.category}</strong>{' '}
                        {goal.status === 'over'
                          ? `ultrapassou a meta em ${formatCurrency(goal.overflow)}.`
                          : `está em ${Math.round(goal.ratio * 100)}% da meta.`}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </section>
        )}

        {activeTab === 'launch' && (
          <section className="screen">
            <article className="panel">
              <div className="panel-heading">
                <h2>{isEditing ? t('screen.launch.edit') : t('screen.launch.new')}</h2>
              </div>

              {hasLaunchSmartSuggestion && (
                <div className="smart-suggestion-card">
                  <div className="smart-suggestion-head">
                    <strong>Atalho inteligente</strong>
                    <small>
                      Último {formData.type === 'receita' ? 'receita' : 'despesa'} em{' '}
                      {getDisplayDate(suggestedLaunchEntry.date, activeLanguageCode)}
                    </small>
                  </div>
                  <p>
                    {getEntryCategoryLabel(suggestedLaunchEntry)} ·{' '}
                    {Number.isFinite(suggestedLaunchValue)
                      ? formatCurrency(suggestedLaunchValue)
                      : '--'}
                  </p>
                  <div className="smart-suggestion-actions">
                    {canSuggestLaunchValue && (
                      <button
                        className="mini-button"
                        type="button"
                        onClick={() =>
                          applyLaunchSuggestion({
                            includeValue: true,
                            feedback: 'Último valor aplicado.',
                          })
                        }
                      >
                        <Icon name="wallet" size={13} />
                        Usar valor
                      </button>
                    )}
                    {canSuggestLaunchCategory && (
                      <button
                        className="mini-button"
                        type="button"
                        onClick={() =>
                          applyLaunchSuggestion({
                            includeCategory: true,
                            feedback: 'Última categoria aplicada.',
                          })
                        }
                      >
                        <Icon name="tag" size={13} />
                        Usar categoria
                      </button>
                    )}
                    {canApplyFullSuggestion && (
                      <button
                        className="mini-button"
                        type="button"
                        onClick={() =>
                          applyLaunchSuggestion({
                            includeValue: true,
                            includeCategory: true,
                            includePayment: true,
                            includeDescription: true,
                            feedback: 'Sugestão completa aplicada.',
                          })
                        }
                      >
                        <Icon name="check" size={13} />
                        Preencher rápido
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form className="launch-form" onSubmit={handleSubmit}>
                <label>
                  <span className="field-label">
                    <Icon name="reports" size={14} /> Tipo
                  </span>
                  <select
                    className={formErrors.type ? 'input-error' : ''}
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                  {formErrors.type && <p className="form-error">{formErrors.type}</p>}
                </label>

                <label>
                  <span className="field-label">
                    <Icon name="wallet" size={14} /> Valor
                  </span>
                  <input
                    className={formErrors.value ? 'input-error' : ''}
                    name="value"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.value}
                    onChange={handleFormChange}
                  />
                  {formErrors.value && <p className="form-error">{formErrors.value}</p>}
                </label>

                <label>
                  <span className="field-label">
                    <Icon name="tag" size={14} /> Categoria
                  </span>
                  <select
                    className={formErrors.category ? 'input-error' : ''}
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                  >
                    {formCategoryOptions.map((category) => (
                      <option value={category} key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && <p className="form-error">{formErrors.category}</p>}
                </label>

                {formSubcategoryOptions.length > 0 && (
                  <label>
                    <span className="field-label">
                      <Icon name="tag" size={14} /> Subcategoria
                    </span>
                    <select
                      className={formErrors.subcategory ? 'input-error' : ''}
                      name="subcategory"
                      value={activeFormSubcategory}
                      onChange={handleFormChange}
                    >
                      <option value="">Sem subcategoria</option>
                      {formSubcategoryOptions.map((subcategory) => (
                        <option value={subcategory} key={subcategory}>
                          {subcategory}
                        </option>
                      ))}
                    </select>
                    {formErrors.subcategory && <p className="form-error">{formErrors.subcategory}</p>}
                  </label>
                )}

                {formData.type === 'despesa' && (
                  <>
                    <label>
                      <span className="field-label">
                        <Icon name="wallet" size={14} /> Forma de pagamento
                      </span>
                      <select
                        className={formErrors.paymentMethod ? 'input-error' : ''}
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleFormChange}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.paymentMethod && (
                        <p className="form-error">{formErrors.paymentMethod}</p>
                      )}
                    </label>

                    {formData.paymentMethod === 'credito' &&
                      (creditCards.length === 0 ? (
                        <div className="warning-box inline-warning-box">
                          <div className="warning-head">
                            <Icon name="alert" size={14} />
                            <strong>Nenhum cartão cadastrado</strong>
                          </div>
                          <p>
                            Para lançar no crédito, cadastre um cartão na aba <strong>Crédito</strong>.
                          </p>
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() => setActiveTab('credit')}
                          >
                            Ir para Crédito
                          </button>
                        </div>
                      ) : (
                        <label>
                          <span className="field-label">
                            <Icon name="credit" size={14} /> Cartão de crédito
                          </span>
                          <select
                            className={formErrors.creditCardId ? 'input-error' : ''}
                            name="creditCardId"
                            value={resolveSelectedCreditCardId(
                              formData.creditCardId,
                              creditCardsById,
                              creditCards,
                            )}
                            onChange={handleFormChange}
                          >
                            {creditCards.map((card) => (
                              <option key={card.id} value={card.id}>
                                {card.name}
                              </option>
                            ))}
                          </select>
                          {formErrors.creditCardId && (
                            <p className="form-error">{formErrors.creditCardId}</p>
                          )}
                        </label>
                      ))}
                  </>
                )}

                {launchCategoryShortcuts.length > 0 && (
                  <div className="category-shortcuts">
                    <small>Categorias frequentes</small>
                    <div className="chip-row">
                      {launchCategoryShortcuts.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className={`mini-chip ${formData.category === category ? 'active' : ''}`}
                          onClick={() => handleUseCategoryShortcut(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label>
                  <span className="field-label">
                    <Icon name="calendar" size={14} /> Data
                  </span>
                  <input
                    className={formErrors.date ? 'input-error' : ''}
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleFormChange}
                  />
                  {formErrors.date && <p className="form-error">{formErrors.date}</p>}
                </label>

                <label>
                  <span className="field-label">
                    <Icon name="edit" size={14} /> Descrição
                  </span>
                  <textarea
                    className={formErrors.description ? 'input-error' : ''}
                    name="description"
                    rows="3"
                    placeholder="Observação opcional"
                    value={formData.description}
                    onChange={handleFormChange}
                    maxLength={140}
                  />
                  {formErrors.description && <p className="form-error">{formErrors.description}</p>}
                </label>

                <label>
                  <span className="field-label">
                    <Icon name="repeat" size={14} /> Recorrência
                  </span>
                  <select
                    className={formErrors.recurrence ? 'input-error' : ''}
                    name="recurrence"
                    value={formData.recurrence}
                    onChange={handleFormChange}
                  >
                    <option value="none">Não recorrente</option>
                    <option value="monthly">Mensal</option>
                  </select>
                  {formData.recurrence === 'monthly' && (
                    <small className="field-help">
                      Esse lançamento será considerado recorrente e pode ser gerado automaticamente no próximo mês.
                    </small>
                  )}
                  {formErrors.recurrence && <p className="form-error">{formErrors.recurrence}</p>}
                </label>

                <div className="form-actions">
                  <button
                    className={`primary-button ${launchSavedPulse ? 'pulse-on-save' : ''}`}
                    type="submit"
                  >
                    <Icon name="check" size={16} />
                    {isEditing ? 'Atualizar lançamento' : 'Salvar lançamento'}
                  </button>
                  {isEditing && (
                    <button className="ghost-button" type="button" onClick={handleCancelEdit}>
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>
            </article>
          </section>
        )}

        {activeTab === 'credit' && (
          <section className="screen">
            <article className="panel">
              <div className="panel-heading">
                <h2>
                  <Icon name="credit" size={16} className="heading-icon" />
                  Gestão de crédito
                </h2>
                <span>{creditCards.length}/{MAX_CREDIT_CARDS} cartões</span>
              </div>

              <div className="summary-grid">
                <div className="summary-item">
                  <p>Gasto no crédito (mês)</p>
                  <strong>{formatCurrency(monthlyCreditExpense)}</strong>
                </div>
                <div className="summary-item">
                  <p>Limite total</p>
                  <strong>{formatCurrency(creditCardsTotals.limit)}</strong>
                </div>
                <div className="summary-item">
                  <p>Total gasto</p>
                  <strong className={creditCardsTotals.spent > creditCardsTotals.limit ? 'negative' : ''}>
                    {formatCurrency(creditCardsTotals.spent)}
                  </strong>
                </div>
                <div className="summary-item">
                  <p>Disponível total</p>
                  <strong className={creditCardsTotals.available >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(creditCardsTotals.available)}
                  </strong>
                </div>
              </div>

              <div className="credit-progress-block">
                <div className="goal-progress-track">
                  <div
                    className={`goal-progress-fill ${creditUsageRatio > 1 ? 'over' : creditUsageRatio > 0.85 ? 'near' : 'ok'}`}
                    style={{ width: `${Math.min(creditUsageRatio * 100, 100)}%` }}
                  />
                </div>
                <small className="section-note">
                  Uso consolidado dos cartões: {(creditUsageRatio * 100).toFixed(1)}% do limite total.
                </small>
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>
                  <Icon name="credit" size={16} className="heading-icon" />
                  Cartões de crédito
                </h3>
                <span>{creditCardSummaries.length} cartão(ões)</span>
              </div>

              {creditCardsLimitReached && (
                <div className="warning-box inline-warning-box">
                  <div className="warning-head">
                    <Icon name="alert" size={14} />
                    <strong>Limite de cartões atingido</strong>
                  </div>
                  <p>Você já possui {MAX_CREDIT_CARDS} cartões cadastrados.</p>
                </div>
              )}

              <form className="goal-form" onSubmit={handleSaveCreditCard}>
                <label className="filter-control">
                  <span className="field-label">Nome do cartão</span>
                  <input
                    name="name"
                    value={creditCardForm.name}
                    onChange={handleCreditCardChange}
                    className={creditCardErrors.name ? 'input-error' : ''}
                    placeholder="Ex.: Cartão Principal"
                  />
                  {creditCardErrors.name && <p className="form-error">{creditCardErrors.name}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Limite</span>
                  <input
                    name="limit"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={creditCardForm.limit}
                    onChange={handleCreditCardChange}
                    className={creditCardErrors.limit ? 'input-error' : ''}
                    placeholder="0,00"
                  />
                  {creditCardErrors.limit && <p className="form-error">{creditCardErrors.limit}</p>}
                </label>

                <div className="form-actions">
                  <button className="primary-button" type="submit" disabled={creditCardsLimitReached}>
                    <Icon name="check" size={16} />
                    {isEditingCreditCard ? 'Atualizar cartão' : 'Cadastrar cartão'}
                  </button>
                  {isEditingCreditCard && (
                    <button className="ghost-button" type="button" onClick={handleCancelEditCreditCard}>
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>

              {creditCardSummaries.length === 0 ? (
                <div className="empty-state compact">
                  <Icon name="credit" />
                  <p>Nenhum cartão cadastrado.</p>
                  <small>Cadastre um cartão para vincular despesas em crédito.</small>
                </div>
              ) : (
                <ul className="credit-card-list">
                  {creditCardSummaries.map((card) => (
                    <li
                      key={card.id}
                      className={`credit-card-item ${card.overLimit > 0 ? 'over' : card.usageRatio > 0.85 ? 'near' : ''}`}
                    >
                      <div className="credit-card-head">
                        <div>
                          <strong>{card.name}</strong>
                          <small>{card.expenses.length} gasto(s) vinculado(s)</small>
                        </div>
                        <button
                          className="mini-button"
                          type="button"
                          onClick={() => handleStartEditCreditCard(card)}
                        >
                          <Icon name="edit" size={13} />
                          Editar limite
                        </button>
                      </div>

                      <div className="credit-values-grid">
                        <div>
                          <small>Limite total</small>
                          <strong>{formatCurrency(card.limit)}</strong>
                        </div>
                        <div>
                          <small>Valor gasto</small>
                          <strong className={card.overLimit > 0 ? 'negative' : ''}>
                            {formatCurrency(card.totalSpent)}
                          </strong>
                        </div>
                        <div>
                          <small>Disponível</small>
                          <strong className={card.available >= 0 ? 'positive' : 'negative'}>
                            {formatCurrency(card.available)}
                          </strong>
                        </div>
                        <div>
                          <small>Uso do limite</small>
                          <strong className={card.usageRatio > 1 ? 'negative' : ''}>
                            {(card.usageRatio * 100).toFixed(1)}%
                          </strong>
                        </div>
                      </div>

                      <div className="goal-progress-track">
                        <div
                          className={`goal-progress-fill ${card.usageRatio > 1 ? 'over' : card.usageRatio > 0.85 ? 'near' : 'ok'}`}
                          style={{ width: `${Math.min(card.usageRatio * 100, 100)}%` }}
                        />
                      </div>

                      {card.expenses.length === 0 ? (
                        <small className="section-note">Sem gastos nesse cartão até o momento.</small>
                      ) : (
                        <ul className="credit-expense-list">
                          {card.expenses.slice(0, 8).map((entry) => (
                            <li key={entry.id} className="credit-expense-item">
                              <div>
                                <p>{getEntryCategoryLabel(entry)}</p>
                                <small>{getDisplayDate(entry.date, activeLanguageCode)}</small>
                              </div>
                              <strong className="negative">{formatCurrency(entry.value)}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {creditOrphanEntries.length > 0 && (
                <div className="warning-box">
                  <div className="warning-head">
                    <Icon name="alert" size={15} />
                    <strong>Lançamentos sem cartão encontrado</strong>
                  </div>
                  <p>
                    {creditOrphanEntries.length} lançamento(s) em crédito estão sem vínculo válido de cartão.
                  </p>
                </div>
              )}
            </article>
          </section>
        )}

        {activeTab === 'history' && (
          <section className="screen">
            <article className="panel">
              <div className="panel-heading">
                <h2>{t('screen.history.title')}</h2>
                <span>
                  {filteredHistoryEntries.length} de {orderedEntries.length}
                </span>
              </div>

              <div className="history-filters">
                <label className="filter-control search-control">
                  <span className="field-label">
                    <Icon name="search" size={14} /> Busca global
                  </span>
                  <div className="search-input-row">
                    <input
                      type="search"
                      value={globalSearchQuery}
                      onChange={handleGlobalSearchChange}
                      placeholder="Categoria, subcategoria, pagamento, cartão, valor ou data"
                    />
                    {globalSearchQuery && (
                      <button className="mini-button" type="button" onClick={handleClearGlobalSearch}>
                        Limpar
                      </button>
                    )}
                  </div>
                </label>

                <label className="filter-control">
                  <span className="field-label">
                    <Icon name="reports" size={14} /> Tipo
                  </span>
                  <select name="type" value={historyFilters.type} onChange={handleHistoryFilterChange}>
                    <option value="todos">Todos</option>
                    <option value="receita">Receitas</option>
                    <option value="despesa">Despesas</option>
                  </select>
                </label>

                <label className="filter-control">
                  <span className="field-label">
                    <Icon name="tag" size={14} /> Categoria
                  </span>
                  <select
                    name="category"
                    value={activeHistoryCategory}
                    onChange={handleHistoryFilterChange}
                  >
                    {historyCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category === 'todas' ? 'Todas' : category}
                      </option>
                    ))}
                  </select>
                </label>

                {shouldShowHistorySubcategoryFilter && (
                  <label className="filter-control">
                    <span className="field-label">
                      <Icon name="tag" size={14} /> Subcategoria
                    </span>
                    <select
                      name="subcategory"
                      value={activeHistorySubcategory}
                      onChange={handleHistoryFilterChange}
                    >
                      {historySubcategoryOptions.map((subcategory) => (
                        <option key={subcategory} value={subcategory}>
                          {subcategory === 'todas' ? 'Todas' : subcategory}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {orderedEntries.length === 0 ? (
                <div className="empty-state">
                  <Icon name="history" />
                  <p>Sem movimentações até o momento.</p>
                  <small>Assim que você salvar lançamentos, eles aparecerão aqui.</small>
                </div>
              ) : filteredHistoryEntries.length === 0 ? (
                <div className="empty-state">
                  <Icon name="empty" />
                  <p>Nenhum lançamento encontrado com os filtros atuais.</p>
                  <small>Ajuste tipo, categoria ou busca global para ampliar o resultado.</small>
                </div>
              ) : (
                <ul className="entry-list full">
                  {filteredHistoryEntries.map((entry) => (
                    <li key={entry.id} className="entry-item">
                      <div className="entry-main">
                        <p className="entry-title">{getEntryCategoryLabel(entry)}</p>
                        <div className="entry-meta">
                          <small>{getDisplayDate(entry.date, activeLanguageCode)}</small>
                          <span className={`type-pill ${entry.type}`}>{getTypeLabel(entry.type)}</span>
                          {entry.recurrence === 'monthly' && (
                            <span className="tag-pill recurring">
                              <Icon name="repeat" size={12} />
                              Mensal
                            </span>
                          )}
                          {entry.type === 'despesa' && entry.paymentMethod && (
                            <span className="tag-pill payment-method">
                              <Icon
                                name={entry.paymentMethod === 'credito' ? 'credit' : 'wallet'}
                                size={12}
                              />
                              {getPaymentMethodLabel(entry.paymentMethod)}
                            </span>
                          )}
                          {entry.type === 'despesa' && entry.paymentMethod === 'credito' && (
                            <span className="tag-pill credit-card">
                              <Icon name="credit" size={12} />
                              {creditCardsById.get(entry.creditCardId ?? '')?.name ?? 'Sem cartão'}
                            </span>
                          )}
                        </div>
                        {entry.description && <small>{entry.description}</small>}
                      </div>

                      <div className="entry-side">
                        <strong className={entry.type === 'receita' ? 'positive' : 'negative'}>
                          {entry.type === 'receita' ? '+' : '-'}
                          {formatCurrency(entry.value)}
                        </strong>
                        <div className="entry-actions">
                          <button
                            className="mini-button"
                            type="button"
                            onClick={() => handleDuplicateEntry(entry)}
                          >
                            <Icon name="duplicate" size={13} />
                            Duplicar
                          </button>
                          <button
                            className="mini-button"
                            type="button"
                            onClick={() => handleStartEdit(entry)}
                          >
                            <Icon name="edit" size={13} />
                            Editar
                          </button>
                          <button
                            className="mini-button danger"
                            type="button"
                            onClick={() => handleRemoveEntry(entry.id)}
                          >
                            <Icon name="trash" size={13} />
                            Remover
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        )}

        {activeTab === 'investments' && (
          <section className="screen">
            <article className="panel">
              <div className="panel-heading">
                <h2>
                  <Icon name="investments" size={16} className="heading-icon" />
                  {t('screen.investments.title')}
                </h2>
                <span>{getMonthLabelFromKey(currentMonthKey, activeLanguageCode)}</span>
              </div>

              <div className="report-grid">
                <div className="report-card">
                  <p>Patrimônio investido total</p>
                  <strong>{formatCurrency(portfolioTotals.investedCurrent)}</strong>
                </div>
                <div className="report-card">
                  <p>Caixa disponível</p>
                  <strong>{formatCurrency(portfolioTotals.cashCurrent)}</strong>
                </div>
                <div className="report-card">
                  <p>Aporte do mês</p>
                  <strong>{formatCurrency(monthlyInvestmentAporte)}</strong>
                </div>
                <div className="report-card">
                  <p>Rendimento acumulado</p>
                  <strong className={portfolioTotals.variationTotal >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(accumulatedYieldFromMovements)}
                  </strong>
                </div>
              </div>

              <div className="panel-subsection">
                <h4>Resumo por classe de ativo</h4>
                {topInvestmentClasses.length === 0 ? (
                  <div className="empty-state compact">
                    <Icon name="empty" />
                    <p>Nenhuma classe de ativo com saldo.</p>
                    <small>Cadastre ativos e movimentações para começar.</small>
                  </div>
                ) : (
                  <ul className="class-summary-list">
                    {topInvestmentClasses.map((item) => {
                      const participation =
                        portfolioTotals.currentTotal > 0
                          ? (item.currentValue / portfolioTotals.currentTotal) * 100
                          : 0

                      return (
                        <li key={item.assetType} className="class-summary-item">
                          <div className="class-summary-head">
                            <strong>{item.assetType}</strong>
                            <small>{participation.toFixed(1)}% da carteira</small>
                          </div>
                          <div className="class-summary-values">
                            <small>Aplicado: {formatCurrency(item.appliedValue)}</small>
                            <small>Atual: {formatCurrency(item.currentValue)}</small>
                          </div>
                          <div className="goal-progress-track">
                            <div
                              className="goal-progress-fill"
                              style={{ width: `${Math.min(participation, 100)}%` }}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="panel-subsection">
                <h4>Painel consolidado (evolução patrimonial)</h4>
                {portfolioEvolution.length === 0 ? (
                  <div className="empty-state compact">
                    <Icon name="trend" />
                    <p>Sem dados para evolução.</p>
                    <small>Os pontos mensais surgem conforme as movimentações.</small>
                  </div>
                ) : (
                  <div className="evolution-list">
                    {portfolioEvolution.map((item) => (
                      <div key={item.monthKey} className="evolution-item">
                        <div className="evolution-head">
                          <small>{item.label}</small>
                          <strong>{formatCurrency(item.currentTotal)}</strong>
                        </div>
                        <div className="goal-progress-track">
                          <div
                            className="goal-progress-fill"
                            style={{ width: `${Math.min((item.currentTotal / maxEvolutionValue) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>
                  <Icon name="building" size={16} className="heading-icon" />
                  Carteira
                </h3>
                <span>{filteredPortfolioItems.length} ativos</span>
              </div>

              <div className="history-filters">
                <label className="filter-control">
                  <span className="field-label">
                    <Icon name="filter" size={14} /> Tipo de ativo
                  </span>
                  <select
                    name="assetType"
                    value={investmentFilters.assetType}
                    onChange={handleInvestmentFilterChange}
                  >
                    {investmentAssetTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === 'todos' ? 'Todos' : option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <form className="goal-form" onSubmit={handleSaveInvestmentAsset}>
                <label className="filter-control">
                  <span className="field-label">Nome do ativo</span>
                  <input
                    name="name"
                    value={investmentAssetForm.name}
                    onChange={handleInvestmentAssetChange}
                    className={investmentAssetErrors.name ? 'input-error' : ''}
                    placeholder="Ex.: Tesouro Selic 2029"
                  />
                  {investmentAssetErrors.name && <p className="form-error">{investmentAssetErrors.name}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Tipo de ativo</span>
                  <select
                    name="assetType"
                    value={investmentAssetForm.assetType}
                    onChange={handleInvestmentAssetChange}
                    className={investmentAssetErrors.assetType ? 'input-error' : ''}
                  >
                    {INVESTMENT_ASSET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {investmentAssetErrors.assetType && <p className="form-error">{investmentAssetErrors.assetType}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Preço atual (opcional)</span>
                  <input
                    name="currentUnitPrice"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={investmentAssetForm.currentUnitPrice}
                    onChange={handleInvestmentAssetChange}
                    className={investmentAssetErrors.currentUnitPrice ? 'input-error' : ''}
                    placeholder="0,00"
                  />
                  {investmentAssetErrors.currentUnitPrice && <p className="form-error">{investmentAssetErrors.currentUnitPrice}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Valor atual total (opcional)</span>
                  <input
                    name="currentTotalValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={investmentAssetForm.currentTotalValue}
                    onChange={handleInvestmentAssetChange}
                    className={investmentAssetErrors.currentTotalValue ? 'input-error' : ''}
                    placeholder="0,00"
                  />
                  {investmentAssetErrors.currentTotalValue && <p className="form-error">{investmentAssetErrors.currentTotalValue}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Observação</span>
                  <textarea
                    name="note"
                    rows="2"
                    value={investmentAssetForm.note}
                    onChange={handleInvestmentAssetChange}
                    placeholder="Comentário opcional sobre o ativo"
                  />
                </label>

                <div className="form-actions">
                  <button className="primary-button" type="submit">
                    <Icon name="check" size={16} />
                    {isEditingInvestmentAsset ? 'Atualizar ativo' : 'Adicionar ativo'}
                  </button>
                  {isEditingInvestmentAsset && (
                    <button className="ghost-button" type="button" onClick={handleCancelEditInvestmentAsset}>
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>

              {filteredPortfolioItems.length === 0 ? (
                <div className="empty-state compact">
                  <Icon name="building" />
                  <p>Nenhum ativo encontrado para o filtro atual.</p>
                  <small>Cadastre um ativo ou ajuste o filtro por tipo.</small>
                </div>
              ) : (
                <ul className="investment-asset-list">
                  {filteredPortfolioItems.map((asset) => (
                    <li key={asset.id} className="investment-asset-item">
                      <div className="investment-asset-head">
                        <div>
                          <p className="entry-title">{asset.name}</p>
                          <div className="entry-meta">
                            <span className="type-pill asset-type">{asset.assetType}</span>
                            <small>Qtd: {asset.quantity.toFixed(4)}</small>
                          </div>
                        </div>
                        <div className="entry-actions">
                          <button
                            className="mini-button"
                            type="button"
                            onClick={() => handleStartEditInvestmentAsset(asset)}
                          >
                            <Icon name="edit" size={13} />
                            Editar
                          </button>
                          <button
                            className="mini-button danger"
                            type="button"
                            onClick={() => handleRemoveInvestmentAsset(asset.id)}
                          >
                            <Icon name="trash" size={13} />
                            Remover
                          </button>
                        </div>
                      </div>

                      <div className="investment-values-grid">
                        <div>
                          <small>Preço médio</small>
                          <strong>{formatCurrency(asset.averagePrice)}</strong>
                        </div>
                        <div>
                          <small>Aplicado</small>
                          <strong>{formatCurrency(asset.appliedValue)}</strong>
                        </div>
                        <div>
                          <small>Valor atual</small>
                          <strong>{formatCurrency(asset.currentValue)}</strong>
                        </div>
                        <div>
                          <small>Variação</small>
                          <strong className={asset.variation >= 0 ? 'positive' : 'negative'}>
                            {formatCurrency(asset.variation)} ({asset.variationPercent.toFixed(1)}%)
                          </strong>
                        </div>
                      </div>

                      {asset.note && <small className="section-note">{asset.note}</small>}
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>
                  <Icon name="swap" size={16} className="heading-icon" />
                  Movimentações de investimentos
                </h3>
                <span>{filteredInvestmentMovements.length} registros</span>
              </div>

              <form className="goal-form" onSubmit={handleSaveInvestmentMovement}>
                <label className="filter-control">
                  <span className="field-label">Data</span>
                  <input
                    type="date"
                    name="date"
                    value={investmentMovementForm.date}
                    onChange={handleInvestmentMovementChange}
                    className={investmentMovementErrors.date ? 'input-error' : ''}
                  />
                  {investmentMovementErrors.date && <p className="form-error">{investmentMovementErrors.date}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Tipo de movimentação</span>
                  <select
                    name="movementType"
                    value={investmentMovementForm.movementType}
                    onChange={handleInvestmentMovementChange}
                    className={investmentMovementErrors.movementType ? 'input-error' : ''}
                  >
                    {INVESTMENT_MOVEMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {investmentMovementErrors.movementType && <p className="form-error">{investmentMovementErrors.movementType}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Ativo</span>
                  <select
                    name="assetId"
                    value={activeInvestmentMovementAssetId}
                    onChange={handleInvestmentMovementChange}
                    className={investmentMovementErrors.assetId ? 'input-error' : ''}
                  >
                    {investmentAssetsSafe.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                  {investmentMovementErrors.assetId && <p className="form-error">{investmentMovementErrors.assetId}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Categoria/tipo</span>
                  <select
                    name="assetType"
                    value={activeInvestmentMovementAssetType}
                    onChange={handleInvestmentMovementChange}
                  >
                    {INVESTMENT_ASSET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-control">
                  <span className="field-label">Quantidade</span>
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={investmentMovementForm.quantity}
                    onChange={handleInvestmentMovementChange}
                    className={investmentMovementErrors.quantity ? 'input-error' : ''}
                    placeholder="0,0000"
                  />
                  {investmentMovementErrors.quantity && <p className="form-error">{investmentMovementErrors.quantity}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Valor</span>
                  <input
                    name="value"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={investmentMovementForm.value}
                    onChange={handleInvestmentMovementChange}
                    className={investmentMovementErrors.value ? 'input-error' : ''}
                    placeholder="0,00"
                  />
                  {investmentMovementErrors.value && <p className="form-error">{investmentMovementErrors.value}</p>}
                </label>

                {investmentMovementForm.movementType === 'transferencia' && (
                  <label className="filter-control">
                    <span className="field-label">Sentido da transferência</span>
                    <select
                      name="transferDirection"
                      value={investmentMovementForm.transferDirection}
                      onChange={handleInvestmentMovementChange}
                      className={investmentMovementErrors.transferDirection ? 'input-error' : ''}
                    >
                      {TRANSFER_DIRECTIONS.map((direction) => (
                        <option key={direction.value} value={direction.value}>
                          {direction.label}
                        </option>
                      ))}
                    </select>
                    {investmentMovementErrors.transferDirection && <p className="form-error">{investmentMovementErrors.transferDirection}</p>}
                  </label>
                )}

                <label className="filter-control">
                  <span className="field-label">Observação</span>
                  <textarea
                    name="note"
                    rows="2"
                    value={investmentMovementForm.note}
                    onChange={handleInvestmentMovementChange}
                    placeholder="Observação opcional da movimentação"
                  />
                </label>

                <button className="primary-button" type="submit">
                  <Icon name="check" size={16} />
                  Registrar movimentação
                </button>
              </form>

              <div className="history-filters">
                <label className="filter-control search-control">
                  <span className="field-label">
                    <Icon name="search" size={14} /> Busca global
                  </span>
                  <div className="search-input-row">
                    <input
                      type="search"
                      value={globalSearchQuery}
                      onChange={handleGlobalSearchChange}
                      placeholder="Ativo, movimentação, valor ou observação"
                    />
                    {globalSearchQuery && (
                      <button className="mini-button" type="button" onClick={handleClearGlobalSearch}>
                        Limpar
                      </button>
                    )}
                  </div>
                </label>

                <label className="filter-control">
                  <span className="field-label">
                    <Icon name="filter" size={14} /> Filtro por tipo de ativo
                  </span>
                  <select
                    name="assetType"
                    value={investmentFilters.assetType}
                    onChange={handleInvestmentFilterChange}
                  >
                    {investmentAssetTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === 'todos' ? 'Todos' : option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-control">
                  <span className="field-label">
                    <Icon name="filter" size={14} /> Filtro por movimentação
                  </span>
                  <select
                    name="movementType"
                    value={investmentFilters.movementType}
                    onChange={handleInvestmentFilterChange}
                  >
                    <option value="todos">Todas</option>
                    {INVESTMENT_MOVEMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filteredInvestmentMovements.length === 0 ? (
                <div className="empty-state compact">
                  <Icon name="swap" />
                  <p>Nenhuma movimentação para os filtros atuais.</p>
                  <small>Registre movimentações ou ajuste filtros e busca global.</small>
                </div>
              ) : (
                <ul className="entry-list full">
                  {filteredInvestmentMovements.map((movement) => (
                    <li key={movement.id} className="entry-item">
                      <div className="entry-main">
                        <p className="entry-title">{investmentAssetsById.get(movement.assetId)?.name ?? 'Ativo removido'}</p>
                        <div className="entry-meta">
                          <small>{getDisplayDate(movement.date, activeLanguageCode)}</small>
                          <span className="tag-pill recurring">{getMovementTypeLabel(movement.movementType)}</span>
                          <span className="type-pill asset-type">{movement.assetType}</span>
                        </div>
                        <small>
                          Qtd: {movement.quantity.toFixed(4)} · Valor: {formatCurrency(movement.value)}
                          {movement.note ? ` · ${movement.note}` : ''}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="mini-button danger"
                        onClick={() => handleRemoveInvestmentMovement(movement.id)}
                      >
                        <Icon name="trash" size={13} />
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>
                  <Icon name="diary" size={16} className="heading-icon" />
                  Diário de investimentos
                </h3>
                <span>{sortedInvestmentJournal.length} anotações</span>
              </div>

              <form className="goal-form" onSubmit={handleSaveInvestmentJournal}>
                <label className="filter-control">
                  <span className="field-label">Data</span>
                  <input
                    type="date"
                    name="date"
                    value={investmentJournalForm.date}
                    onChange={handleInvestmentJournalChange}
                    className={investmentJournalErrors.date ? 'input-error' : ''}
                  />
                  {investmentJournalErrors.date && <p className="form-error">{investmentJournalErrors.date}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Ativo relacionado (opcional)</span>
                  <select
                    name="assetId"
                    value={activeInvestmentJournalAssetId}
                    onChange={handleInvestmentJournalChange}
                  >
                    <option value="">Sem ativo específico</option>
                    {investmentAssetsSafe.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-control">
                  <span className="field-label">Anotação</span>
                  <textarea
                    name="note"
                    rows="3"
                    maxLength={280}
                    value={investmentJournalForm.note}
                    onChange={handleInvestmentJournalChange}
                    className={investmentJournalErrors.note ? 'input-error' : ''}
                    placeholder="O que você observou na carteira hoje?"
                  />
                  {investmentJournalErrors.note && <p className="form-error">{investmentJournalErrors.note}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Motivo da decisão</span>
                  <textarea
                    name="reason"
                    rows="2"
                    maxLength={200}
                    value={investmentJournalForm.reason}
                    onChange={handleInvestmentJournalChange}
                    className={investmentJournalErrors.reason ? 'input-error' : ''}
                    placeholder="Racional da entrada/saída ou ajuste"
                  />
                  {investmentJournalErrors.reason && <p className="form-error">{investmentJournalErrors.reason}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Plano / próximo passo</span>
                  <textarea
                    name="plan"
                    rows="2"
                    maxLength={200}
                    value={investmentJournalForm.plan}
                    onChange={handleInvestmentJournalChange}
                    className={investmentJournalErrors.plan ? 'input-error' : ''}
                    placeholder="Qual ação você pretende tomar depois?"
                  />
                  {investmentJournalErrors.plan && <p className="form-error">{investmentJournalErrors.plan}</p>}
                </label>

                <button className="primary-button" type="submit">
                  <Icon name="check" size={16} />
                  Salvar anotação
                </button>
              </form>

              {sortedInvestmentJournal.length === 0 ? (
                <div className="empty-state compact">
                  <Icon name="diary" />
                  <p>Diário ainda vazio.</p>
                  <small>Registre decisões para acompanhar sua evolução como investidor.</small>
                </div>
              ) : (
                <ul className="entry-list full">
                  {sortedInvestmentJournal.map((entry) => (
                    <li key={entry.id} className="entry-item">
                      <div className="entry-main">
                        <p className="entry-title">{getDisplayDate(entry.date, activeLanguageCode)}</p>
                        <div className="entry-meta">
                          {entry.assetId ? (
                            <span className="type-pill asset-type">
                              {investmentAssetsById.get(entry.assetId)?.name ?? 'Ativo removido'}
                            </span>
                          ) : (
                            <span className="tag-pill recurring">Geral</span>
                          )}
                        </div>
                        <small>{entry.note}</small>
                        {entry.reason && <small>Motivo: {entry.reason}</small>}
                        {entry.plan && <small>Plano: {entry.plan}</small>}
                      </div>
                      <button
                        type="button"
                        className="mini-button danger"
                        onClick={() => handleRemoveInvestmentJournal(entry.id)}
                      >
                        <Icon name="trash" size={13} />
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        )}

        {activeTab === 'reports' && (
          <section className="screen">
            <article className="panel">
              <div className="panel-heading">
                <h2>{t('screen.reports.title')}</h2>
              </div>

              <div className="report-grid">
                <div className="report-card">
                  <p>Taxa de poupança</p>
                  <strong className={savingsRate >= 0 ? 'positive' : 'negative'}>
                    {savingsRate.toFixed(1)}%
                  </strong>
                </div>
                <div className="report-card">
                  <p>Lançamentos no mês</p>
                  <strong>{monthlyEntries.length}</strong>
                </div>
                <div className="report-card">
                  <p>Recorrências ativas</p>
                  <strong>{recurringActiveCount}</strong>
                </div>
                <div className="report-card">
                  <p>Metas cadastradas</p>
                  <strong>{Object.keys(categoryGoals).length}</strong>
                </div>
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>{t('screen.reports.expensesCurrentMonth')}</h3>
              </div>

              {monthlyExpenseByCategory.length === 0 ? (
                <div className="empty-state">
                  <Icon name="empty" />
                  <p>Sem despesas registradas neste mês.</p>
                  <small>Assim que houver despesas, o resumo por categoria aparece aqui.</small>
                </div>
              ) : (
                <ul className="entry-list">
                  {monthlyExpenseByCategory.map((item) => (
                    <li key={item.category} className="entry-item">
                      <div className="entry-main">
                        <p className="entry-title">{item.category}</p>
                        {item.subcategories.length > 0 && (
                          <small>
                            {item.subcategories
                              .map(
                                ([subcategory, total]) =>
                                  `${subcategory}: ${formatCurrency(total)}`,
                              )
                              .join(' · ')}
                          </small>
                        )}
                      </div>
                      <strong className="negative">{formatCurrency(item.total)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>
                  <Icon name="target" size={16} className="heading-icon" />
                  Metas de gasto por categoria
                </h3>
              </div>

              <form className="goal-form" onSubmit={handleSaveGoal}>
                <label className="filter-control">
                  <span className="field-label">Categoria</span>
                  <select
                    name="category"
                    value={activeGoalCategory}
                    onChange={handleGoalChange}
                    className={goalErrors.category ? 'input-error' : ''}
                  >
                    {goalCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {goalErrors.category && <p className="form-error">{goalErrors.category}</p>}
                </label>

                <label className="filter-control">
                  <span className="field-label">Limite mensal</span>
                  <input
                    name="limit"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={goalForm.limit}
                    onChange={handleGoalChange}
                    className={goalErrors.limit ? 'input-error' : ''}
                  />
                  {goalErrors.limit && <p className="form-error">{goalErrors.limit}</p>}
                </label>

                <button className="primary-button" type="submit">
                  <Icon name="check" size={16} />
                  Salvar meta
                </button>
              </form>

              {goalProgressList.length === 0 ? (
                <div className="empty-state compact">
                  <Icon name="target" />
                  <p>Nenhuma meta cadastrada ainda.</p>
                  <small>Cadastre um limite para acompanhar gastos por categoria.</small>
                </div>
              ) : (
                <ul className="goal-list">
                  {goalProgressList.map((goal) => (
                    <li key={goal.category} className={`goal-item ${goal.status}`}>
                      <div className="goal-top">
                        <strong>{goal.category}</strong>
                        <span className={`goal-status ${goal.status}`}>
                          {goal.status === 'ok' && 'Dentro da meta'}
                          {goal.status === 'near' && 'Próximo do limite'}
                          {goal.status === 'over' && 'Meta ultrapassada'}
                        </span>
                      </div>

                      <div className="goal-values">
                        <small>Gasto: {formatCurrency(goal.spent)}</small>
                        <small>Meta: {formatCurrency(goal.limit)}</small>
                      </div>

                      <div className="goal-progress-track">
                        <div
                          className={`goal-progress-fill ${goal.status}`}
                          style={{ width: `${goal.progressWidth}%` }}
                        />
                      </div>

                      <div className="goal-foot">
                        <small>
                          {goal.status === 'over'
                            ? `Ultrapassou em ${formatCurrency(goal.overflow)}`
                            : `Restam ${formatCurrency(goal.remaining)}`}
                        </small>
                        <button
                          type="button"
                          className="mini-button danger"
                          onClick={() => handleRemoveGoal(goal.category)}
                        >
                          <Icon name="trash" size={13} />
                          Remover
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>
                  <Icon name="backup" size={16} className="heading-icon" />
                  Backup e restauração
                </h3>
              </div>

              <p className="section-note">
                Exporte ou restaure lançamentos, metas, recorrências e investimentos em um único arquivo JSON.
              </p>

              <div className="backup-actions">
                <button className="primary-button" type="button" onClick={handleExportBackup}>
                  <Icon name="backup" size={16} />
                  Exportar backup
                </button>
                <button className="ghost-button" type="button" onClick={handleRequestImport}>
                  <Icon name="restore" size={16} />
                  Importar backup
                </button>
              </div>

              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden-input"
                onChange={handleImportBackup}
              />

              {pendingImport && (
                <div className="warning-box">
                  <div className="warning-head">
                    <Icon name="alert" size={15} />
                    <strong>Confirme para restaurar</strong>
                  </div>
                  <p>
                    O backup <strong>{pendingImport.fileName}</strong> irá substituir os dados atuais.
                  </p>
                    <ul className="warning-list">
                      <li>Lançamentos: {pendingImport.summary.entriesCount}</li>
                      <li>Metas: {pendingImport.summary.goalsCount}</li>
                      <li>Cartões de crédito: {pendingImport.summary.creditCardsCount}</li>
                      <li>Recorrências: {pendingImport.summary.recurringCount}</li>
                    <li>Ativos de investimento: {pendingImport.summary.investmentAssetsCount}</li>
                    <li>Movimentações de investimento: {pendingImport.summary.investmentMovementsCount}</li>
                    <li>Anotações do diário: {pendingImport.summary.investmentJournalCount}</li>
                    <li>Versão do backup: {pendingImport.summary.version}</li>
                  </ul>
                  <div className="warning-actions">
                    <button className="primary-button" type="button" onClick={handleConfirmImport}>
                      Confirmar restauração
                    </button>
                    <button className="ghost-button" type="button" onClick={handleCancelImport}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </article>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {PRIMARY_TAB_ITEMS.map((tab) => {
          const isMenuTab = tab.isMenu
          const isTabActive = isMenuTab ? isSecondaryMenuOpen : activeTab === tab.id

          const navButton = (
            <button
              type="button"
              key={tab.id}
              className={`nav-item ${tab.isAction ? 'launch-action' : ''} ${isTabActive ? 'active' : ''}`}
              onClick={() => {
                if (isMenuTab) {
                  handleToggleSecondaryMenu()
                  return
                }
                setIsSecondaryMenuOpen(false)
                setSecondaryMenuSection('main')
                setActiveTab(tab.id)
              }}
              aria-haspopup={isMenuTab ? 'menu' : undefined}
              aria-expanded={isMenuTab ? isSecondaryMenuOpen : undefined}
              aria-label={isMenuTab ? t('menu.open') : undefined}
            >
              {tab.isAction ? (
                <span className="launch-circle" aria-hidden="true">
                  <Icon name="plus" size={20} />
                </span>
              ) : (
                <>
                  <span className="nav-indicator" aria-hidden="true" />
                  <Icon name={tab.icon} size={18} />
                </>
              )}
              <span className="nav-label">{t(`nav.${tab.id}`)}</span>
            </button>
          )

          if (!isMenuTab) {
            return navButton
          }

          return (
            <div className="nav-menu-slot" key={tab.id} ref={secondaryMenuRef}>
              {navButton}

              {isSecondaryMenuOpen && (
                <div
                  className="secondary-menu-panel bottom-menu-panel"
                  role="menu"
                  aria-label={t('menu.section')}
                >
                  {secondaryMenuSection === 'main' ? (
                    <>
                      <p className="menu-section-title">{t('menu.section')}</p>
                      <div className="secondary-menu-links">
                        {SECONDARY_MENU_ITEMS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`secondary-menu-link ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => handleNavigateFromMenu(item.id)}
                          >
                            <span className="secondary-menu-link-main">
                              <Icon name={item.icon} size={15} />
                              {t(`menu.${item.id}`)}
                            </span>
                            <Icon name="chevron-right" size={14} />
                          </button>
                        ))}
                        <button
                          type="button"
                          className={`secondary-menu-link ${secondaryMenuSection === 'settings' ? 'active' : ''}`}
                          onClick={handleOpenSettingsSection}
                        >
                          <span className="secondary-menu-link-main">
                            <Icon name="settings" size={15} />
                            {t('menu.settings')}
                          </span>
                          <Icon name="chevron-right" size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="settings-menu-head">
                        <button
                          className="mini-button"
                          type="button"
                          onClick={handleBackToMainMenu}
                        >
                          <Icon name="chevron-left" size={14} />
                          {t('menu.settings.back')}
                        </button>
                        <strong>{t('menu.settings.title')}</strong>
                      </div>

                      <div className="settings-controls">
                        <label className="settings-control">
                          <span>
                            <Icon name="reports" size={14} /> {t('settings.language')}
                          </span>
                          <select
                            value={activeLanguageCode}
                            onChange={(event) => handleSelectLanguage(event.target.value)}
                          >
                            {LANGUAGE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="settings-control">
                          <span>
                            <Icon name="wallet" size={14} /> {t('settings.currency')}
                          </span>
                          <select
                            value={activeCurrencyCode}
                            onChange={(event) => handleSelectCurrency(event.target.value)}
                          >
                            {CURRENCY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="settings-control">
                          <span>
                            <Icon name="system" size={14} /> {t('settings.theme')}
                          </span>
                          <select
                            value={themePreference}
                            onChange={(event) => handleSelectTheme(event.target.value)}
                          >
                            {THEME_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {t(option.labelKey)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

export default App
