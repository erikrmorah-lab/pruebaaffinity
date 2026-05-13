// security.js - Versión Profesional
// Sistema de seguridad para Affinity - Estudio Creativo
// Diseñado con estándares de seguridad de 2026

const Security = (function() {
    'use strict';

    // ============================================
    // CONFIGURACIÓN INTERNA (NO EXPUESTA)
    // ============================================
    
    // Las constantes sensibles están encapsuladas en el closure
    const CONFIG = {
        // Las iteraciones se aumentan a 120,000 para 2026 (estándar OWASP)
        PBKDF2_ITERATIONS: 120000,
        KEY_SIZE: 256, // bits
        HASH_ALGORITHM: 'SHA-256',
        MIN_PASSWORD_LENGTH: 10,
        SESSION_TOKEN_LENGTH: 32
    };

    // ============================================
    // UTILIDADES INTERNAS
    // ============================================

    /**
     * Genera un salt criptográficamente seguro
     * @param {number} length - Longitud en bytes
     * @returns {string} Salt en base64
     */
    function generateSecureSalt(length = 32) {
        return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Base64);
    }

    /**
     * Genera un token de sesión seguro
     * @returns {string} Token de sesión
     */
    function generateSessionToken() {
        return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    }

    /**
     * Deriva una clave usando PBKDF2 con salt específico
     * @param {string} password - Contraseña base
     * @param {string} salt - Salt específico
     * @param {number} iterations - Número de iteraciones
     * @returns {string} Clave derivada
     */
    function deriveKeyWithSalt(password, salt, iterations = CONFIG.PBKDF2_ITERATIONS) {
        return CryptoJS.PBKDF2(password, salt, {
            keySize: CONFIG.KEY_SIZE / 32,
            iterations: iterations,
            hasher: CryptoJS.algo.SHA256
        }).toString();
    }

    // ============================================
    // GESTOR DE CLAVES MAESTRAS (SEGURO)
    // ============================================

    /**
     * Gestor de claves maestro que obtiene las claves de forma segura
     * @returns {object} Claves maestras
     */
    const KeyManager = {
        /**
         * Obtiene la clave maestra desde múltiples fuentes posibles
         * @returns {string} Clave maestra
         */
        getMasterKey: function() {
            // Prioridad 1: Variable de entorno (en producción)
            if (window._AFFINITY_MASTER_KEY && window._AFFINITY_MASTER_KEY.length > 32) {
                return window._AFFINITY_MASTER_KEY;
            }
            
            // Prioridad 2: Prompt seguro (solo para desarrollo/demo)
            // En producción, esto debería venir del servidor
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('⚠️ MODO DESARROLLO: Usando clave maestra derivada del navegador');
                // Derivar clave de características del navegador + timestamp del día
                const browserFingerprint = [
                    navigator.userAgent,
                    navigator.language,
                    screen.colorDepth,
                    new Date().toDateString() // Cambia cada día
                ].join('|');
                return CryptoJS.SHA256(browserFingerprint).toString();
            }
            
            // Prioridad 3: Generar clave temporal y forzar obtención externa
            throw new Error('SECURITY_ERROR: No se puede obtener la clave maestra. La aplicación necesita una clave maestra segura.');
        },

        /**
         * Inicializa las claves maestras de forma segura
         * @param {string} customKey - Clave personalizada (opcional)
         */
        initialize: function(customKey = null) {
            if (customKey) {
                // Si se proporciona una clave, almacenarla de forma segura
                // No en memoria global, solo en closure
                this._masterKey = customKey;
            }
        }
    };

    // ============================================
    // HASH DE CONTRASEÑAS CON SALT POR USUARIO
    // ============================================

    const PasswordHasher = {
        /**
         * Hashea una contraseña con salt único
         * @param {string} password - Contraseña en texto plano
         * @returns {object} Objeto con hash y salt
         */
        hash: function(password) {
            // Validar longitud mínima
            if (password.length < CONFIG.MIN_PASSWORD_LENGTH) {
                throw new Error(`La contraseña debe tener al menos ${CONFIG.MIN_PASSWORD_LENGTH} caracteres`);
            }

            // Generar salt único para este usuario
            const salt = generateSecureSalt(32);
            
            // Aplicar PBKDF2 con el salt específico
            const hash = deriveKeyWithSalt(password, salt, CONFIG.PBKDF2_ITERATIONS);
            
            // Almacenar metadata de seguridad
            return {
                hash: hash,
                salt: salt,
                iterations: CONFIG.PBKDF2_ITERATIONS,
                version: '2.0',
                algorithm: 'PBKDF2-HMAC-SHA256'
            };
        },

        /**
         * Verifica una contraseña contra su hash
         * @param {string} password - Contraseña a verificar
         * @param {object} storedData - Datos almacenados del usuario
         * @returns {boolean} True si la contraseña es válida
         */
        verify: function(password, storedData) {
            // Extraer datos de seguridad
            const { hash: storedHash, salt, iterations = CONFIG.PBKDF2_ITERATIONS } = storedData;
            
            // Recalcular hash con el mismo salt
            const computedHash = deriveKeyWithSalt(password, salt, iterations);
            
            // Comparación segura en tiempo constante
            return this.constantTimeCompare(computedHash, storedHash);
        },

        /**
         * Comparación en tiempo constante para evitar timing attacks
         * @param {string} a - Primer string
         * @param {string} b - Segundo string
         * @returns {boolean} True si son iguales
         */
        constantTimeCompare: function(a, b) {
            if (!a || !b) return false;
            if (a.length !== b.length) return false;
            
            let result = 0;
            for (let i = 0; i < a.length; i++) {
                result |= a.charCodeAt(i) ^ b.charCodeAt(i);
            }
            return result === 0;
        }
    };

    // ============================================
    // ENCRIPTACIÓN AES-256 CON CLAVES DINÁMICAS
    // ============================================

    const Encryptor = {
        /**
         * Encripta datos usando una clave derivada de la sesión
         * @param {any} data - Datos a encriptar
         * @param {string} sessionToken - Token de sesión (opcional)
         * @returns {object} Datos encriptados con metadata
         */
        encrypt: function(data, sessionToken = null) {
            try {
                // Obtener clave maestra
                const masterKey = KeyManager.getMasterKey();
                
                // Generar clave de sesión si no se proporciona
                const token = sessionToken || generateSessionToken();
                
                // Derivar clave de encriptación usando masterKey + token
                const encryptionKey = CryptoJS.PBKDF2(masterKey + token, generateSecureSalt(16), {
                    keySize: CONFIG.KEY_SIZE / 32,
                    iterations: CONFIG.PBKDF2_ITERATIONS / 10, // Menos iteraciones para rendimiento
                    hasher: CryptoJS.algo.SHA256
                }).toString();
                
                // Generar IV único
                const iv = CryptoJS.lib.WordArray.random(16);
                
                // Encriptar
                const dataString = JSON.stringify(data);
                const encrypted = CryptoJS.AES.encrypt(dataString, encryptionKey, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                });
                
                // Retornar estructura segura
                return {
                    version: '2.0',
                    token: token,
                    iv: iv.toString(CryptoJS.enc.Base64),
                    data: encrypted.toString(),
                    timestamp: Date.now()
                };
            } catch (error) {
                console.error('Error encriptando datos:', error);
                return null;
            }
        },

        /**
         * Desencripta datos usando el token de sesión
         * @param {object} encryptedData - Datos encriptados con metadata
         * @returns {any} Datos desencriptados
         */
        decrypt: function(encryptedData) {
            try {
                if (!encryptedData || encryptedData.version !== '2.0') {
                    throw new Error('Formato de datos inválido');
                }

                const masterKey = KeyManager.getMasterKey();
                
                // Derivar clave de encriptación con el mismo método
                const encryptionKey = CryptoJS.PBKDF2(masterKey + encryptedData.token, generateSecureSalt(16), {
                    keySize: CONFIG.KEY_SIZE / 32,
                    iterations: CONFIG.PBKDF2_ITERATIONS / 10,
                    hasher: CryptoJS.algo.SHA256
                }).toString();
                
                // Reconstruir IV
                const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
                
                // Desencriptar
                const decrypted = CryptoJS.AES.decrypt(encryptedData.data, encryptionKey, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                });
                
                const dataString = decrypted.toString(CryptoJS.enc.Utf8);
                return JSON.parse(dataString);
            } catch (error) {
                console.error('Error desencriptando datos:', error);
                return null;
            }
        }
    };

    // ============================================
    // ALMACENAMIENTO SEGURO CON SESIÓN
    // ============================================

    const SecureStorage = (function() {
        // Almacenar token de sesión de forma segura (no expuesto)
        let sessionToken = null;
        
        return {
            /**
             * Inicializa el almacenamiento con un token de sesión
             * @param {string} token - Token de sesión
             */
            initSession: function(token) {
                sessionToken = token;
            },

            /**
             * Guarda datos encriptados en localStorage
             * @param {string} key - Clave de almacenamiento
             * @param {any} value - Valor a guardar
             * @returns {boolean} True si se guardó correctamente
             */
            setItem: function(key, value) {
                try {
                    // Generar token de sesión si no existe
                    const token = sessionToken || generateSessionToken();
                    if (!sessionToken) sessionToken = token;
                    
                    const encrypted = Encryptor.encrypt(value, token);
                    if (encrypted) {
                        localStorage.setItem(key, JSON.stringify(encrypted));
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Error en SecureStorage.setItem:', error);
                    return false;
                }
            },

            /**
             * Recupera datos desencriptados de localStorage
             * @param {string} key - Clave de almacenamiento
             * @returns {any} Datos desencriptados
             */
            getItem: function(key) {
                try {
                    if (!sessionToken) return null;
                    
                    const encryptedStr = localStorage.getItem(key);
                    if (!encryptedStr) return null;
                    
                    const encrypted = JSON.parse(encryptedStr);
                    return Encryptor.decrypt(encrypted);
                } catch (error) {
                    console.error('Error en SecureStorage.getItem:', error);
                    return null;
                }
            },

            /**
             * Elimina un item de localStorage
             * @param {string} key - Clave a eliminar
             */
            removeItem: function(key) {
                localStorage.removeItem(key);
            },

            /**
             * Limpia todo el localStorage
             */
            clear: function() {
                localStorage.clear();
            },

            /**
             * Cierra la sesión actual
             */
            endSession: function() {
                sessionToken = null;
            }
        };
    })();

    // ============================================
    // GESTOR DE AUTENTICACIÓN SEGURA
    // ============================================

    const SecureAuth = {
        /**
         * Registra un nuevo usuario con salt dinámico
         * @param {Array} users - Array de usuarios
         * @param {object} userData - Datos del usuario
         * @returns {object} Usuario registrado (sin contraseña)
         */
        registerUser: function(users, userData) {
            // Validar contraseña
            const validation = SecurityValidator.validatePassword(userData.password);
            if (!validation.isValid) {
                throw new Error('Contraseña inválida: ' + validation.errors.join(', '));
            }

            // Hashear contraseña con salt único
            const passwordData = PasswordHasher.hash(userData.password);
            
            // Crear usuario con datos de seguridad
            const newUser = {
                ...userData,
                passwordData: {
                    hash: passwordData.hash,
                    salt: passwordData.salt,
                    iterations: passwordData.iterations,
                    version: passwordData.version
                },
                createdAt: new Date().toISOString(),
                securityVersion: '2.0'
            };
            
            // Eliminar contraseña en texto plano
            delete newUser.password;
            delete newUser.confirmPassword;
            
            users.push(newUser);
            
            // Retornar usuario sin datos sensibles
            const safeUser = { ...newUser };
            delete safeUser.passwordData;
            return safeUser;
        },

        /**
         * Autentica un usuario
         * @param {Array} users - Array de usuarios
         * @param {string} email - Email del usuario
         * @param {string} password - Contraseña en texto plano
         * @returns {object|null} Usuario autenticado (sin datos sensibles)
         */
        authenticateUser: function(users, email, password) {
            const user = users.find(u => u.email === email);
            if (!user) return null;
            
            // Verificar contraseña con salt específico del usuario
            const isValid = PasswordHasher.verify(password, user.passwordData);
            if (!isValid) return null;
            
            // Crear copia segura del usuario
            const safeUser = { ...user };
            delete safeUser.passwordData;
            
            return safeUser;
        },

        /**
         * Autentica un administrador
         * @param {Array} admins - Array de administradores
         * @param {string} username - Username
         * @param {string} password - Contraseña en texto plano
         * @returns {object|null} Admin autenticado (sin datos sensibles)
         */
        authenticateAdmin: function(admins, username, password) {
            const admin = admins.find(a => a.username === username);
            if (!admin) return null;
            
            const isValid = PasswordHasher.verify(password, admin.passwordData);
            if (!isValid) return null;
            
            const safeAdmin = { ...admin };
            delete safeAdmin.passwordData;
            
            return safeAdmin;
        },

        /**
         * Inicia una sesión segura para un usuario
         * @param {object} user - Usuario autenticado
         * @returns {string} Token de sesión
         */
        startSession: function(user) {
            const token = generateSessionToken();
            SecureStorage.initSession(token);
            
            // Guardar información de sesión
            SecureStorage.setItem('currentUser', {
                id: user.id,
                name: user.name,
                email: user.email,
                loginTime: Date.now()
            });
            
            return token;
        },

        /**
         * Cierra la sesión actual
         */
        endSession: function() {
            SecureStorage.endSession();
            SecureStorage.removeItem('currentUser');
        }
    };

    // ============================================
    // VALIDADOR DE SEGURIDAD
    // ============================================

    const SecurityValidator = {
        /**
         * Valida la fortaleza de una contraseña
         * @param {string} password - Contraseña a validar
         * @returns {object} Resultado de la validación
         */
        validatePassword: function(password) {
            const result = {
                isValid: false,
                strength: 0,
                errors: []
            };
            
            if (!password || password.length < CONFIG.MIN_PASSWORD_LENGTH) {
                result.errors.push(`La contraseña debe tener al menos ${CONFIG.MIN_PASSWORD_LENGTH} caracteres`);
            } else {
                result.strength += 20;
            }
            
            if (/[A-Z]/.test(password)) result.strength += 20;
            else result.errors.push('Debe contener al menos una mayúscula');
            
            if (/[a-z]/.test(password)) result.strength += 20;
            else result.errors.push('Debe contener al menos una minúscula');
            
            if (/[0-9]/.test(password)) result.strength += 20;
            else result.errors.push('Debe contener al menos un número');
            
            if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) result.strength += 20;
            else result.errors.push('Debe contener al menos un carácter especial');
            
            result.isValid = result.errors.length === 0;
            return result;
        },

        /**
         * Sanitiza input para prevenir XSS
         * @param {any} input - Input a sanitizar
         * @returns {string} Input sanitizado
         */
        sanitizeInput: function(input) {
            if (!input) return input;
            const str = String(input);
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/\(/g, '&#40;')
                .replace(/\)/g, '&#41;')
                .replace(/\//g, '&#47;')
                .replace(/\\/g, '&#92;')
                .replace(/`/g, '&#96;');
        },

        /**
         * Genera un token CSRF
         * @returns {string} Token CSRF
         */
        generateCSRFToken: function() {
            return generateSessionToken();
        }
    };

    // ============================================
    // API PÚBLICA (SOLO LO NECESARIO)
    // ============================================

    return {
        // Solo exponemos métodos específicos, no configuraciones
        hash: function(password) {
            // Método de conveniencia para hashear (uso interno)
            return PasswordHasher.hash(password);
        },
        
        validatePassword: SecurityValidator.validatePassword,
        sanitizeInput: SecurityValidator.sanitizeInput,
        
        // Almacenamiento seguro con sesión
        storage: SecureStorage,
        auth: SecureAuth,
        
        // Utilidades
        generateToken: generateSessionToken,
        
        // Inicialización (debe llamarse al iniciar la app)
        initialize: function(masterKey = null) {
            try {
                KeyManager.initialize(masterKey);
                console.log('✅ Sistema de seguridad inicializado correctamente');
                return true;
            } catch (error) {
                console.error('❌ Error inicializando seguridad:', error);
                return false;
            }
        }
    };

})();

// Exponer solo lo necesario globalmente (para compatibilidad)
if (typeof window !== 'undefined') {
    // Solo exponemos una referencia mínima
    Object.defineProperty(window, 'Security', {
        value: Security,
        writable: false,
        configurable: false
    });
}