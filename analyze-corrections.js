const { chromium } = require('playwright');
const fs = require('fs');

async function analyzetreinosappStatus() {
    console.log('🔍 INICIANDO VERIFICAÇÃO COMPLETA DO TREINOSAPP');
    console.log('=' .repeat(60));
    
    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 375, height: 812 }
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });
    
    const page = await context.newPage();
    
    // Arrays para capturar logs e erros
    const consoleLogs = [];
    const errors = [];
    const networkRequests = [];
    
    // Handlers para capturar informações
    page.on('console', msg => {
        const logEntry = {
            type: msg.type(),
            text: msg.text(),
            location: msg.location(),
            timestamp: new Date().toISOString()
        };
        consoleLogs.push(logEntry);
        console.log(`📊 Console [${msg.type()}]: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
        const errorEntry = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        errors.push(errorEntry);
        console.log(`❌ Page Error: ${error.message}`);
    });
    
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: new Date().toISOString()
        });
    });
    
    try {
        console.log('📡 Conectando ao TreinosApp em localhost:8081...');
        const startTime = Date.now();
        
        // Navegar para o app
        await page.goto('http://localhost:8081', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        const loadTime = Date.now() - startTime;
        console.log(`✅ Conexão estabelecida em ${loadTime}ms`);
        
        // Aguardar um pouco para o app carregar completamente
        await page.waitForTimeout(5000);
        
        console.log('\n🔍 ANÁLISE 1: VERIFICANDO ERRO registerWebModule');
        const registerError = consoleLogs.find(log => 
            log.text.includes('registerWebModule') && log.type === 'error'
        );
        
        if (registerError) {
            console.log(`❌ Erro registerWebModule AINDA PRESENTE: ${registerError.text}`);
        } else {
            console.log('✅ Erro registerWebModule foi CORRIGIDO!');
        }
        
        console.log('\n🔍 ANÁLISE 2: VERIFICANDO RENDERIZAÇÃO');
        const bodyContent = await page.locator('body').innerHTML();
        const hasSignificantContent = bodyContent.trim().length > 200;
        
        if (hasSignificantContent) {
            console.log('✅ Conteúdo significativo sendo renderizado (não mais tela branca)');
            
            // Procurar por elementos específicos
            const elements = {
                root: await page.locator('#root').count(),
                reactRoot: await page.locator('[data-reactroot]').count(),
                buttons: await page.locator('button').count(),
                inputs: await page.locator('input').count(),
                loginElements: await page.locator('[class*="login"], [id*="login"], [data-testid*="login"]').count(),
                errorBoundary: await page.locator('[class*="error"], [data-testid*="error"]').count()
            };
            
            console.log('📊 Elementos encontrados:', elements);
            
            // Verificar se temos indicações de sucesso
            const pageContent = await page.content();
            const successIndicators = ['TreinosApp', 'Login', 'Entrar'].filter(indicator =>
                pageContent.toLowerCase().includes(indicator.toLowerCase())
            );
            
            if (successIndicators.length > 0) {
                console.log(`✅ Indicadores de sucesso: ${successIndicators.join(', ')}`);
            }
            
        } else {
            console.log('❌ Ainda há tela branca ou conteúdo insuficiente');
        }
        
        console.log('\n🔍 ANÁLISE 3: LOGS DO CONSOLE');
        const errorLogs = consoleLogs.filter(log => log.type === 'error');
        const warningLogs = consoleLogs.filter(log => log.type === 'warning');
        const infoLogs = consoleLogs.filter(log => log.type === 'log' || log.type === 'info');
        
        console.log(`📊 Total de logs: ${consoleLogs.length}`);
        console.log(`❌ Erros: ${errorLogs.length}`);
        console.log(`⚠️ Avisos: ${warningLogs.length}`);
        console.log(`ℹ️ Info/Log: ${infoLogs.length}`);
        
        if (errorLogs.length > 0) {
            console.log('\n🚨 ERROS CRÍTICOS ENCONTRADOS:');
            errorLogs.slice(0, 5).forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.text}`);
            });
        }
        
        if (infoLogs.length > 0) {
            console.log('\n✅ LOGS INFORMATIVOS (Primeiros 5):');
            infoLogs.slice(0, 5).forEach((info, index) => {
                console.log(`  ${index + 1}. ${info.text}`);
            });
        }
        
        console.log('\n🔍 ANÁLISE 4: ELEMENTOS DOM E ESTRUTURA');
        const title = await page.title();
        console.log(`📄 Título da página: "${title}"`);
        
        // Verificar estrutura DOM específica
        const domStructure = {
            hasReactRoot: await page.locator('#root').count() > 0,
            hasAppContent: await page.locator('[class*="App"], [id*="App"]').count() > 0,
            hasNavigationContainer: await page.locator('[class*="navigation"]').count() > 0,
            hasLoginScreen: await page.locator('[class*="login"], [data-testid*="login"]').count() > 0,
            hasErrorBoundary: await page.locator('[class*="error"]').count() > 0
        };
        
        console.log('🏗️ Estrutura DOM:', domStructure);
        
        console.log('\n🔍 ANÁLISE 5: CAPTURA DE TELA');
        const screenshotPath = './treinosapp-status-analysis.png';
        await page.screenshot({ 
            path: screenshotPath, 
            fullPage: true 
        });
        console.log(`📸 Screenshot salvo: ${screenshotPath}`);
        
        console.log('\n🔍 ANÁLISE 6: TIMING E PERFORMANCE');
        console.log(`⏱️ Tempo de carregamento inicial: ${loadTime}ms`);
        
        const loadingElements = await page.locator('[class*="loading"], [class*="spinner"]').count();
        if (loadingElements > 0) {
            console.log(`🔄 Elementos de loading detectados: ${loadingElements}`);
        }
        
        console.log('\n🔍 ANÁLISE 7: REQUISIÇÕES DE REDE');
        console.log(`📡 Total de requisições: ${networkRequests.length}`);
        if (networkRequests.length > 0) {
            console.log('📡 Principais requisições:');
            networkRequests.slice(0, 10).forEach((req, index) => {
                console.log(`  ${index + 1}. ${req.method} ${req.url}`);
            });
        }
        
        // RESUMO FINAL
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMO DA ANÁLISE - STATUS DAS CORREÇÕES');
        console.log('='.repeat(60));
        
        const analysisResult = {
            registerWebModuleError: !registerError,
            renderingWorking: hasSignificantContent,
            criticalErrors: errorLogs.length,
            hasContent: domStructure.hasReactRoot,
            loadTime: loadTime,
            totalLogs: consoleLogs.length
        };
        
        // Status do erro registerWebModule
        if (analysisResult.registerWebModuleError) {
            console.log('✅ Erro registerWebModule: CORRIGIDO');
        } else {
            console.log('❌ Erro registerWebModule: AINDA PRESENTE');
        }
        
        // Status da renderização
        if (analysisResult.renderingWorking) {
            console.log('✅ Renderização: FUNCIONANDO (não mais tela branca)');
        } else {
            console.log('❌ Renderização: AINDA COM PROBLEMAS');
        }
        
        // Status dos logs
        if (analysisResult.criticalErrors === 0) {
            console.log('✅ Logs: LIMPOS (sem erros críticos)');
        } else {
            console.log(`⚠️ Logs: ${analysisResult.criticalErrors} erros críticos encontrados`);
        }
        
        // Status geral
        const isFixed = analysisResult.registerWebModuleError && 
                       analysisResult.renderingWorking && 
                       analysisResult.criticalErrors === 0;
        
        if (isFixed) {
            console.log('🎉 STATUS GERAL: CORREÇÕES FORAM TOTALMENTE EFETIVAS!');
        } else if (analysisResult.registerWebModuleError && analysisResult.renderingWorking) {
            console.log('✅ STATUS GERAL: CORREÇÕES PRINCIPAIS EFETIVAS - Alguns erros menores detectados');
        } else {
            console.log('⚠️ STATUS GERAL: AINDA HÁ PROBLEMAS SIGNIFICATIVOS');
        }
        
        // Salvar relatório detalhado
        const report = {
            timestamp: new Date().toISOString(),
            loadTime: loadTime,
            analysisResult: analysisResult,
            domStructure: domStructure,
            consoleLogs: consoleLogs,
            errors: errors,
            networkRequests: networkRequests.slice(0, 20) // Apenas as primeiras 20
        };
        
        fs.writeFileSync('./treinosapp-analysis-report.json', 
                        JSON.stringify(report, null, 2));
        console.log('📊 Relatório detalhado salvo: treinosapp-analysis-report.json');
        
        return analysisResult;
        
    } catch (error) {
        console.error('❌ Erro durante análise:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Executar a análise
analyzetreinosappStatus()
    .then(result => {
        console.log('\n🏁 Análise concluída com sucesso!');
        console.log('📊 Resultado:', result);
    })
    .catch(error => {
        console.error('\n💥 Falha na análise:', error.message);
    });