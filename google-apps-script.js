// ========================================
// GOOGLE APPS SCRIPT - BACKEND
// ========================================
// Cole este código no Google Apps Script conectado a uma planilha

// Nome das abas da planilha
const ABA_AGENDAMENTOS = 'Agendamentos';
const ABA_HORARIOS = 'Horarios';

// Função principal que recebe requisições GET e POST
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getHorarios') {
    return getHorariosDisponiveis(e.parameter.data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'Ação inválida'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'agendar') {
      return agendarHorario(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Ação inválida'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Erro ao processar requisição: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// BUSCAR HORÁRIOS DISPONÍVEIS
// ========================================
function getHorariosDisponiveis(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetHorarios = ss.getSheetByName(ABA_HORARIOS);
    let sheetAgendamentos = ss.getSheetByName(ABA_AGENDAMENTOS);
    
    // Criar abas se não existirem
    if (!sheetHorarios) {
      sheetHorarios = ss.insertSheet(ABA_HORARIOS);
      inicializarHorarios(sheetHorarios);
    }
    
    if (!sheetAgendamentos) {
      sheetAgendamentos = ss.insertSheet(ABA_AGENDAMENTOS);
      inicializarAgendamentos(sheetAgendamentos);
    }
    
    // Buscar horários padrão da aba Horarios
    const horariosData = sheetHorarios.getDataRange().getValues();
    const horariosPadrao = horariosData.slice(1).map(row => row[0]).filter(h => h !== '');
    
    // Buscar agendamentos já feitos para esta data
    const agendamentosData = sheetAgendamentos.getDataRange().getValues();
    const horariosOcupados = agendamentosData
      .slice(1)
      .filter(row => row[3] === data) // Coluna D = Data
      .map(row => row[4]); // Coluna E = Horário
    
    // Filtrar horários disponíveis
    const horariosDisponiveis = horariosPadrao.filter(h => !horariosOcupados.includes(h));
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      horarios: horariosDisponiveis
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Erro ao buscar horários: ' + error.message,
      horarios: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// AGENDAR HORÁRIO
// ========================================
function agendarHorario(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ABA_AGENDAMENTOS);
    
    if (!sheet) {
      sheet = ss.insertSheet(ABA_AGENDAMENTOS);
      inicializarAgendamentos(sheet);
    }
    
    // Verificar se o horário ainda está disponível
    const dataRange = sheet.getDataRange().getValues();
    const jaAgendado = dataRange.slice(1).some(row => 
      row[3] === dados.data && row[4] === dados.horario
    );
    
    if (jaAgendado) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Este horário acabou de ser reservado. Por favor, escolha outro.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Adicionar novo agendamento
    const timestamp = new Date().toLocaleString('pt-BR');
    sheet.appendRow([
      timestamp,
      dados.nome,
      dados.telefone,
      dados.servico,
      dados.data,
      dados.horario,
      'Confirmado'
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Agendamento confirmado com sucesso!'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Erro ao agendar: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// INICIALIZAR ABA DE HORÁRIOS
// ========================================
function inicializarHorarios(sheet) {
  // Cabeçalho
  sheet.appendRow(['Horários Disponíveis']);
  
  // Horários padrão (você pode personalizar)
  const horarios = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];
  
  horarios.forEach(h => sheet.appendRow([h]));
  
  // Formatar
  sheet.getRange(1, 1).setFontWeight('bold').setBackground('#f3f4f6');
  sheet.setColumnWidth(1, 150);
}

// ========================================
// INICIALIZAR ABA DE AGENDAMENTOS
// ========================================
function inicializarAgendamentos(sheet) {
  // Cabeçalho
  sheet.appendRow([
    'Timestamp',
    'Nome',
    'Telefone',
    'Serviço',
    'Data',
    'Horário',
    'Status'
  ]);
  
  // Formatar cabeçalho
  const header = sheet.getRange(1, 1, 1, 7);
  header.setFontWeight('bold').setBackground('#f3f4f6');
  
  // Ajustar largura das colunas
  sheet.setColumnWidth(1, 150); // Timestamp
  sheet.setColumnWidth(2, 200); // Nome
  sheet.setColumnWidth(3, 130); // Telefone
  sheet.setColumnWidth(4, 150); // Serviço
  sheet.setColumnWidth(5, 100); // Data
  sheet.setColumnWidth(6, 80);  // Horário
  sheet.setColumnWidth(7, 100); // Status
}