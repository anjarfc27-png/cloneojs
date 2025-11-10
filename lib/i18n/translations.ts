export type Language = 'en' | 'es' | 'fr-ca' | 'fr' | 'pt-br' | 'pt' | 'ru' | 'ar' | 'id'

export interface Translations {
  // Header
  headerTitle: string
  register: string
  login: string
  
  // Breadcrumbs
  home: string
  
  // Login Page
  loginTitle: string
  requiredFields: string
  username: string
  password: string
  forgotPassword: string
  keepLoggedIn: string
  loginButton: string
  invalidCredentials: string
  
  // Language
  language: string
  openJournalSystems: string
}

export const translations: Record<Language, Translations> = {
  en: {
    headerTitle: 'Open Journal Systems',
    register: 'Register',
    login: 'Login',
    home: 'Home',
    loginTitle: 'Login',
    requiredFields: 'Required fields are marked with an asterisk:',
    username: 'Username',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    keepLoggedIn: 'Keep me logged in',
    loginButton: 'Login',
    invalidCredentials: 'Invalid username or password. Please try again.',
    language: 'Language',
    openJournalSystems: 'Open Journal Systems',
  },
  es: {
    headerTitle: 'Open Journal Systems',
    register: 'Registrarse',
    login: 'Iniciar sesión',
    home: 'Inicio',
    loginTitle: 'Iniciar sesión',
    requiredFields: 'Los campos obligatorios están marcados con un asterisco:',
    username: 'Nombre de usuario',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    keepLoggedIn: 'Mantenerme conectado',
    loginButton: 'Iniciar sesión',
    invalidCredentials: 'Nombre de usuario o contraseña inválidos. Por favor, inténtalo de nuevo.',
    language: 'Idioma',
    openJournalSystems: 'Open Journal Systems',
  },
  'fr-ca': {
    headerTitle: 'Open Journal Systems',
    register: 'S\'inscrire',
    login: 'Connexion',
    home: 'Accueil',
    loginTitle: 'Connexion',
    requiredFields: 'Les champs obligatoires sont marqués d\'un astérisque:',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié?',
    keepLoggedIn: 'Rester connecté',
    loginButton: 'Connexion',
    invalidCredentials: 'Nom d\'utilisateur ou mot de passe invalide. Veuillez réessayer.',
    language: 'Langue',
    openJournalSystems: 'Open Journal Systems',
  },
  fr: {
    headerTitle: 'Open Journal Systems',
    register: 'S\'inscrire',
    login: 'Connexion',
    home: 'Accueil',
    loginTitle: 'Connexion',
    requiredFields: 'Les champs obligatoires sont marqués d\'un astérisque:',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié?',
    keepLoggedIn: 'Rester connecté',
    loginButton: 'Connexion',
    invalidCredentials: 'Nom d\'utilisateur ou mot de passe invalide. Veuillez réessayer.',
    language: 'Langue',
    openJournalSystems: 'Open Journal Systems',
  },
  'pt-br': {
    headerTitle: 'Open Journal Systems',
    register: 'Registrar',
    login: 'Entrar',
    home: 'Início',
    loginTitle: 'Entrar',
    requiredFields: 'Campos obrigatórios estão marcados com um asterisco:',
    username: 'Nome de usuário',
    password: 'Senha',
    forgotPassword: 'Esqueceu sua senha?',
    keepLoggedIn: 'Manter-me conectado',
    loginButton: 'Entrar',
    invalidCredentials: 'Nome de usuário ou senha inválidos. Por favor, tente novamente.',
    language: 'Idioma',
    openJournalSystems: 'Open Journal Systems',
  },
  pt: {
    headerTitle: 'Open Journal Systems',
    register: 'Registar',
    login: 'Iniciar sessão',
    home: 'Início',
    loginTitle: 'Iniciar sessão',
    requiredFields: 'Os campos obrigatórios estão marcados com um asterisco:',
    username: 'Nome de utilizador',
    password: 'Palavra-passe',
    forgotPassword: 'Esqueceu-se da palavra-passe?',
    keepLoggedIn: 'Manter-me ligado',
    loginButton: 'Iniciar sessão',
    invalidCredentials: 'Nome de utilizador ou palavra-passe inválidos. Por favor, tente novamente.',
    language: 'Idioma',
    openJournalSystems: 'Open Journal Systems',
  },
  ru: {
    headerTitle: 'Open Journal Systems',
    register: 'Регистрация',
    login: 'Вход',
    home: 'Главная',
    loginTitle: 'Вход',
    requiredFields: 'Обязательные поля отмечены звездочкой:',
    username: 'Имя пользователя',
    password: 'Пароль',
    forgotPassword: 'Забыли пароль?',
    keepLoggedIn: 'Оставаться в системе',
    loginButton: 'Войти',
    invalidCredentials: 'Неверное имя пользователя или пароль. Пожалуйста, попробуйте снова.',
    language: 'Язык',
    openJournalSystems: 'Open Journal Systems',
  },
  ar: {
    headerTitle: 'Open Journal Systems',
    register: 'التسجيل',
    login: 'تسجيل الدخول',
    home: 'الرئيسية',
    loginTitle: 'تسجيل الدخول',
    requiredFields: 'الحقول المطلوبة محددة بعلامة النجمة:',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    keepLoggedIn: 'البقاء متصلاً',
    loginButton: 'تسجيل الدخول',
    invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.',
    language: 'اللغة',
    openJournalSystems: 'Open Journal Systems',
  },
  id: {
    headerTitle: 'Open Journal Systems',
    register: 'Daftar',
    login: 'Masuk',
    home: 'Beranda',
    loginTitle: 'Masuk',
    requiredFields: 'Bidang yang wajib diisi ditandai dengan tanda bintang:',
    username: 'Nama pengguna',
    password: 'Kata sandi',
    forgotPassword: 'Lupa kata sandi Anda?',
    keepLoggedIn: 'Tetap masuk',
    loginButton: 'Masuk',
    invalidCredentials: 'Nama pengguna atau kata sandi tidak valid. Silakan coba lagi.',
    language: 'Bahasa',
    openJournalSystems: 'Open Journal Systems',
  },
}

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español (España)',
  'fr-ca': 'Français (Canada)',
  fr: 'Français (France)',
  'pt-br': 'Português (Brasil)',
  pt: 'Português (Portugal)',
  ru: 'Русский',
  ar: 'العربية',
  id: 'Bahasa Indonesia',
}

