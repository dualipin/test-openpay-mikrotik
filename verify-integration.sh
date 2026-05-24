#!/bin/bash

# Script de verificación de integración OpenPay

echo "═══════════════════════════════════════════════════════════════"
echo "   VERIFICACIÓN DE INTEGRACIÓN OPENPAY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (FALTA)"
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (FALTA)"
        return 1
    fi
}

echo "📁 Archivos Backend:"
check_file "api/src/server.ts"
check_file "api/src/index.ts"
check_file "api/.env.example"

echo ""
echo "📁 Archivos Frontend:"
check_file "web/src/components/PayForm.tsx"
check_file "web/.env.example"

echo ""
echo "📁 Documentación:"
check_file "INTEGRATION.md"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "   PASOS SIGUIENTES"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. Configurar variables de entorno:"
echo "   • api/.env (con credenciales OpenPay)"
echo "   • web/.env (con credenciales OpenPay)"
echo ""
echo "2. Instalar dependencias:"
echo "   cd api && npm install"
echo "   cd web && npm install"
echo ""
echo "3. Iniciar servidores:"
echo "   Terminal 1: cd api && npm run dev"
echo "   Terminal 2: cd web && npm run dev"
echo ""
echo "4. Abrir navegador:"
echo "   http://localhost:5173 (Frontend Vite)"
echo ""
echo "5. Revisar pagos guardados:"
echo "   ls api/payments/"
echo ""
echo "═══════════════════════════════════════════════════════════════"
