import React from 'react';
import { green, red, grey } from '@material-ui/core/colors';
import { Box, Card, Typography } from '@material-ui/core';
import theme from '../theme';
import validateSchema from '../validateSchema';
import { getMaxSteps } from '../lib';

const getTruthValFromCoordinates = (numRows, row, col) => 0 === Math.floor(row / (numRows / Math.pow(2, col + 1)) % 2);

const getHeaders = (headers, mainOpIndex) => {
  const getStyle = (header, index) => {
    const style = {
      backgroundColor: header.bgColor || grey['700'],
    }
    if (mainOpIndex === index) style.fontWeight = 'bold'
    return style;
  };
  return headers.map((header, i) => 
    (
      <th className={i === mainOpIndex ? 'mainOp' : ''} style={ getStyle(header, i) } key={i}>{header.value}</th>
    )
  );
};

const getRows = (rows, mainOpIndex) => {
  const getCellStyle = (val, index) => {
    const isMainOpColumn = mainOpIndex === index;
    const style = {
      backgroundColor: 
        val === true  ? 
          isMainOpColumn ? green['700'] : green['500'] :
        val === false ? 
          isMainOpColumn ? red['700']   : red['500']   : 
        grey['500']
    };
    if (mainOpIndex === index) {
      style.fontWeight = 'bold'
    }
    return style;
  }
  const getCellDisplayValue = (val) => {
    let cellDisplayValue = '?';
    if (typeof val === 'string') {
      cellDisplayValue = val;
    }
    else if (val === true) {
      cellDisplayValue = 'T';
    }
    else if (val === false) {
      cellDisplayValue = 'F';
    }
    return cellDisplayValue;
  }
  return rows.map((row, rowIndex) => 
    (
      <tr key={rowIndex}>
        {row.map((val, cellIndex) =>  
          (
            <td className={mainOpIndex === cellIndex ? 'mainOp' : ''} key={cellIndex} style={ getCellStyle(val, cellIndex) }>
              { getCellDisplayValue(val) }
            </td>
          )
        )}
      </tr>
    )
  );
};

const getTableDimensions = (numSentenceLetters) => {
  return {
    numCols: numSentenceLetters, 
    numRows: Math.pow(2, numSentenceLetters)
  };
};

const getLegend = (sentenceLetters) => {
  const { numRows, numCols } = getTableDimensions(sentenceLetters?.length);
  const legend = {};
  for (let col = 0; col < numCols; col++) {
    const { value: legendKey }= sentenceLetters[col];
    legend[legendKey] = [];
    for (let row = 0; row < numRows; row++) {
      legend[legendKey].push(getTruthValFromCoordinates(numRows, row, col));
    }
  }
  return legend;
};

const getTableModel = (schema, numRows, legend) => {
  const tableModel = [];
  for (let row = 0; row < numRows; row++) {
    const rowData = [];
    schema.forEach(el => {
      const { elType, value } = el;
      let cellValue;
      if (elType === 'L' && legend[value]) {
        cellValue = legend[value][row];
      }
      if (elType === 'G') {
        cellValue = value;
      }
      rowData.push(cellValue);
    });
    tableModel.push(rowData);
  }
  return tableModel;
};

const getCardTable = (config) => {
  const { style, headers, table, onEdit, onDelete, onNext, onPrev, showButtons } = config;
  const buttonStyle = {
    backgroundColor: grey[600],
    border: `1px solid ${grey[900]}`,
    width: '1.5rem',
    height: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    margin: '0.1rem',
    borderRadius: '3px', 
    cursor: 'pointer',
    boxShadow: `1px 1px 1px ${grey[800]}`
  }
  const buttons = (
    <Box style={{display: 'flex', justifyContent: 'flex-end'}}>
      
      <Box style={buttonStyle} onClick={onPrev}>
        <Typography>{'\u23EA'}</Typography>
      </Box>
      <Box style={buttonStyle} onClick={onNext}>
        <Typography>{'\u23E9'}</Typography>
      </Box>
      
      <Box style={buttonStyle} onClick={onEdit}>
        <Typography>{'\u270E'}</Typography>
      </Box>
      <Box style={buttonStyle} onClick={onDelete}>
        <Typography>{'\u{1F5D1}'}</Typography>
      </Box>
    </Box>
  );
  return (
    <Card raised className="Card" style={style}>
      { showButtons &&  buttons }
      <table>
        <thead>
          <tr>{ headers }</tr>
        </thead>
        <tbody>{ table }</tbody>
      </table>
    </Card>
  );
};

const setupOpMap = (schema) => {
  const map = {};
  const opMap = {};
  schema.forEach((sym, i) => {
    if (sym.elType === 'O' || sym.elType === 'N') {
      const { value } = sym;
      if (map[value]) {
        map[value]++;
      } 
      else {
        map[value] = 1;
      } 
      const id = `${value}${map[value]}`; // operator ids
      sym.opMapId = id;
      opMap[id] = i;
    }
  });
  return opMap;
};

const getDeepestScopes = (schema) => {
  let indeces = [];
  let depth = 0, max = 0, start, end;
  schema.forEach((el, i) => {
    if (el?.value === '(') {
      depth++;
      if (depth > max) {
        max = depth;
      }
      if (depth >= max) {
        start = i;
      }
    }
    if (el?.value ===')') {
      if (depth === max) {
        end = i;
        indeces.push([start, end]);
      }
      depth--;
    }
  });
  return indeces;
};

const getNextOperator = (schema) => {
  let index, innermostNot;
  for (let prec = 0; prec <= 3; prec++) {
    for (let i = 0; i < schema.length; i++) {
      if (schema[i]?.precedence === prec) {
        index = i;
        if (prec === 0) {
          innermostNot = index;
        }
        else {
          return innermostNot >= 0 ? innermostNot : index;
        }
      } 
    }
  }
  return index;
};

const computeOperator = (data) => {
  const { schema, opIndex, table, numRows } = data;
  const { value: operator, opMapId } = schema[opIndex];
  let result = [],  numArgs = 2;
  for (let row = 0; row < numRows; row++) {
    let value;
    let L, R;
    if (opIndex - 1 >= 0) L = table[row][opIndex - 1];
    if (opIndex + 1 < table[row].length) R = table[row][opIndex + 1];
    switch (operator) {
      case '\u00AC': // not
        value = !R; 
        numArgs = 1;
        break;
      case '\u2228': // or
        value = L || R; 
        break;
      case '\u2227': // and
        value = L && R;
        break;
      case '\u21D2': // if
        value = !L || R; 
        break;
      case '\u21D4': // iff
        value = L === R;
        break;
      case '\u22BB': // xor
        value = L !== R;
        break;
      default:
    }
    result.push(value);
  }
  const resultObj = {
    result: result,
    numArgs: numArgs,
    opMapId: opMapId
  }
  return resultObj;
};

const computeTable = (tableData) => {
  const { schema, tableModel, numRows } = tableData;
  let { symbols, steps } = schema;
  const schemaCopy = symbols.map(el => Object.assign({}, el));
  const tableCopy = tableModel.map(row => row.slice());
  const opMap = setupOpMap(schemaCopy); 
  let scopes = getDeepestScopes(schemaCopy);
  let scopedIndex;
  
  // do scoped operations (if any) from the innermost scope outwards
  while (scopes.length > 0) {
    const [ start, end ] = scopes.shift();
    const subSchema = schemaCopy.splice(start, end + 1 - start);
    subSchema.shift();  // remove opening paren
    subSchema.pop();    // remoce closing paren
    const subTable = [];
    tableCopy.forEach(row => {
      const subTableData = row.splice(start, end + 1 - start);
      subTableData.shift();
      subTableData.pop();
      subTable.push(subTableData);
    });
    const { result, mainOpIndex, stepsLeft } = doOperations({
      subSchema: subSchema,
      subTable: subTable,
      tableModel: tableModel,
      opMap: opMap,
      numRows: numRows,
      steps: steps
    });
    steps = stepsLeft;
    if (mainOpIndex) scopedIndex = mainOpIndex;
    schemaCopy.splice(start, 0, {elType: 'SCOPE'});
    for (let i = 0; i < tableCopy.length; i++) {
      tableCopy[i].splice(start, 0, result[i]);
    }
    scopes = getDeepestScopes(schemaCopy);
  }
  // do remaining unscoped operations (if any)
  const { mainOpIndex } = doOperations({
    subSchema: schemaCopy,
    subTable: tableCopy,
    tableModel: tableModel,
    opMap: opMap,
    numRows: numRows,
    steps: steps
  });
  if (mainOpIndex >= 0) scopedIndex = mainOpIndex;
  return scopedIndex;
};

const doOperations = (schemaData) => {
  const { subSchema, subTable, tableModel, opMap, numRows } = schemaData;
  let { steps } = schemaData;
  let mainResult = subTable.flat();  // .flat() needed for simplifications of '(p)'
  let opIndex = getNextOperator(subSchema);
  let modelIndex;

  while (opIndex !== undefined && steps > 0) {
    const { numArgs, opMapId, result } = computeOperator({
      schema: subSchema,
      opIndex: opIndex, 
      table: subTable,
      numRows: numRows
    });
    mainResult = result;
    subSchema.splice(numArgs === 2 ? opIndex - 1 : opIndex, numArgs + 1, {elType: 'COMPUTED'});
    for (let i = 0; i < subTable.length; i++) {
      subTable[i].splice(numArgs === 2 ? opIndex - 1 : opIndex, numArgs + 1, result[i]);
    }
    modelIndex = opMap[opMapId];
    for (let i = 0; i < tableModel.length; i++) {
      tableModel[i][modelIndex] = result[i];
    }
    opIndex = getNextOperator(subSchema);
    steps--;
  }
  console.log(modelIndex);
  const finalResult = {
    result: mainResult,
    mainOpIndex: modelIndex,
    stepsLeft: steps
  }
  return finalResult;
};

const getSchemaTable = (tableData) => {
  const { schema, sentenceLetters, onEdit, onDelete, onNext, onPrev, showButtons } = tableData;
  let { symbols, steps } = schema;
  const { numRows } = getTableDimensions(sentenceLetters.length);
  const legend = getLegend(sentenceLetters);
  const tableModel = getTableModel(symbols, numRows, legend);
  let schemaTableHeaders = getHeaders(symbols);
  let schemaTable = getRows(tableModel);
  const style = { 
    display: symbols.length === 0 && 'none',
    backgroundColor: !showButtons ? theme.palette.primary.dark : theme.palette.grey['700']
  }

  if (validateSchema(symbols)) {
    const mainOpIndex = computeTable({
      tableModel: tableModel,
      schema: schema, 
      numRows: numRows,
      steps: steps
    });
    schemaTableHeaders = getHeaders(symbols, mainOpIndex);
    schemaTable = getRows(tableModel, mainOpIndex);
  }
  return getCardTable({
    style: style,
    headers: schemaTableHeaders,
    table: schemaTable,
    onEdit: onEdit,
    onDelete: onDelete,
    onNext: onNext,
    onPrev: onPrev,
    showButtons
  });
};

const getSavedPremiseTables = (tableData) => {
  const { sentenceLetters, premises, setPremises, setSchema } = tableData;
  const onEdit = (index) => {
    const [schema] = premises.splice(index, index + 1);
    const steps = getMaxSteps(schema.symbols);
    setPremises([...premises]);
    schema.type = 'P';
    setSchema({...schema, steps: steps});
  }
  const onDelete = (index) => {
    premises.splice(index, index + 1);
    setPremises([...premises]);
  }
  const onNext = (index) => {
    const max = getMaxSteps(premises[index].symbols);
    premises[index].steps < max && premises[index].steps++;
    setPremises([...premises]);
  }
  const onPrev = (index) => {
    premises[index].steps > 0 && premises[index].steps--;
    setPremises([...premises]);
  }
  return premises.map((schema, i) => getSchemaTable({
    sentenceLetters: sentenceLetters,
    schema: schema,
    tableType: 'Premise',
    onEdit: () => onEdit(i),
    onDelete: () => onDelete(i),
    onNext: () => onNext(i),
    onPrev: () => onPrev(i),
    showButtons: true
  }));
};

export { getSchemaTable, getSavedPremiseTables };