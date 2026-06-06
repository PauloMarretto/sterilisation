# 🚀 Guia de Instalação - Windows

## Pré-requisitos

Este guia ajudará você a instalar e configurar o **Projeto Cabinet** no Windows.

### Requisitos do Sistema

- **Windows 7 ou superior** (Windows 10/11 recomendado)
- **Conexão com Internet**
- **Permissões de Administrador**
- **Espaço em disco**: ~500MB

---

## ✨ Instalação Automática (RECOMENDADO)

### Passo 1: Baixe o script de instalação

1. Abra o repositório: https://github.com/PauloMarretto/cabinet
2. Localize o arquivo **`install.bat`**
3. Clique em **Raw** (ou botão direito e "Salvar como")
4. Salve em uma pasta (ex: `C:\Instalacao`)

### Passo 2: Execute o script

1. **Clique com botão direito** no arquivo `install.bat`
2. Selecione **"Executar como administrador"**
3. Aguarde a conclusão (levará 5-10 minutos)

### O que o script faz automaticamente:

✅ Instala **Node.js 20 LTS**  
✅ Instala **Git**  
✅ Clona o repositório  
✅ Instala dependências (`npm install`)  
✅ Cria atalhos na Área de Trabalho  
✅ Cria script de inicialização  

---

## 🎯 Iniciando o Projeto

### Opção 1: Usar o Atalho da Área de Trabalho
- Clique duas vezes em **"Iniciar Cabinet.lnk"**
- O servidor iniciará automaticamente

### Opção 2: Executar o script `iniciar.bat`
- Navegue até a pasta do projeto
- Clique duas vezes em **`iniciar.bat`**

### Opção 3: Linha de comando manual
```bash
cd C:\Users\SeuUsuario\cabinet
npm start