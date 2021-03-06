import { getMaxSteps } from '../lib';

// begin public functions

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
}

const getTableDimensions = (numSentenceLetters) => {
  return {
    numCols: numSentenceLetters, 
    numRows: Math.pow(2, numSentenceLetters)
  };
}

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
}

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
}

const getTableButtonHandlers = (stateObj) => {
  const { data, setData, setSchema } = stateObj;
  const maxSteps = getMaxSteps(data?.symbols);
  const onCollapse = () => setData({...data, collapsed: !data.collapsed});
  const onPrev = () => {
    if (data.steps > 0)  {
      data.steps--;
      setData({...data});
    }
  };
  const onNext = () => {
    if (data.steps < maxSteps) {
      data.steps++;
      setData({...data});
    }
  };
  const onEdit = () => {
    setData(null);
    setSchema({...data, steps: maxSteps});
  };
  const onDelete = () => setData(null);

  return {
    onEdit: onEdit,
    onDelete: onDelete,
    onNext: onNext,
    onPrev: onPrev,
    onCollapse: onCollapse,
  }
}

// end public functions

const getTruthValFromCoordinates = (numRows, row, col) => 0 === Math.floor(row / (numRows / Math.pow(2, col + 1)) % 2);

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
}

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
}

const getNextOperator = (schema) => {
  let index, innermostNot;
  for (let prec = 0; prec <= 4; prec++) {
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
}

const computeOperator = (data) => {
  const { schema, opIndex, table, numRows } = data;
  const { value: operator, opMapId } = schema[opIndex];
  let result = [],  numArgs = 2;
  for (let row = 0; row < numRows; row++) {
    let L, R, value, valid;
    if (opIndex - 1 >= 0) L = table[row][opIndex - 1];
    if (opIndex + 1 < table[row].length) R = table[row][opIndex + 1];
    valid = !(L === undefined || R=== undefined);
    switch (operator) {
      case '\u00AC': // not
        numArgs = 1;
        valid = R !== undefined;
        value = !R; 
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
    if (valid) result.push(value);
  }
  const resultObj = {
    result: result,
    numArgs: numArgs,
    opMapId: opMapId
  }
  return resultObj;
}

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
  const finalResult = {
    result: mainResult,
    mainOpIndex: modelIndex,
    stepsLeft: steps
  }
  return finalResult;
}

export {
  computeTable,
  getTableDimensions, 
  getLegend,
  getTableModel,
  getTableButtonHandlers,
};