import React from 'react';
import { green, red, grey } from '@material-ui/core/colors';
import Card  from '@material-ui/core/Card';
import theme from '../theme';

const getHeaders = (arr) => {
  const getStyle = (header) => {
    return {
      backgroundColor: header.bgColor ? header.bgColor : grey['700']
    }
  };
  return arr.map((header, i) => 
    (
      <th style={getStyle(header)} key={i}>{header.value}</th>
    )
  );
};

const getRows = (arr) => {
  const getStyle = (rowVal) => {
    return {
      backgroundColor: rowVal === true ? green['500'] : rowVal === false ? red['500'] : grey['500']
    };
  }
  return arr.map((row, i) => 
    (
      <tr key={i}>
        {row.map((val, key) =>  
          (
            <td key={key} style={getStyle(val)}>
              {val === true ? 'T' : val === false ? 'F' : '?'}
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
}

const getTruthValFromCoordinates = (numRows, row, col) => Math.floor(row / (numRows / Math.pow(2, col + 1)) % 2) === 0;

const getLegend = (sentenceLetters) => {
  const { numRows, numCols } = getTableDimensions(sentenceLetters.length);
  const legend = {}
  for (let col = 0; col < numCols; col++) {
    const key = sentenceLetters[col].value;
    legend[key] = [];
    for (let row = 0; row < numRows; row++) {
      legend[key].push(getTruthValFromCoordinates(numRows, row, col));
    }
  }
  return legend;
}

const getCardTable = (config) => {
  const { key, style, headers, table } = config;
  return (
    <Card key={ key ? key : null } raised className="Card" style={style}>
      <table>
        <thead>
          <tr>{ headers }</tr>
        </thead>
        <tbody>{ table }</tbody>
      </table>
    </Card>
  );
}

const getLegendTable = (sentenceLetters) => {
  const { numCols, numRows } = getTableDimensions(sentenceLetters.length);
  const legendTableHeaders = getHeaders(sentenceLetters);
  const style = {
    backgroundColor: theme.palette.grey['700']
  }
  const legendTable = [];
  for (let row = 0; row < numRows; row++) {
    const rowElements = [];
    for (let col = 0; col < numCols; col++) {
      const truthVal = getTruthValFromCoordinates(numRows, row, col);
      const cellColor = {
        backgroundColor: truthVal ? green['500'] : red['500']
      }
      rowElements.push(
        <td key={col} style={cellColor}>
          {truthVal ? 'T' : 'F'}
        </td>
      );
    }
    legendTable.push(
      <tr key={row}>
        {rowElements}
      </tr>
    );
  }

  return getCardTable({
    key: 'legend',
    style: style, 
    headers: legendTableHeaders, 
    table: legendTable
  });
}

const getSchemaTable = (tableData) => {
  const { schema, sentenceLetters, key } = tableData;
  const { numRows } = getTableDimensions(sentenceLetters.length);
  const legend = getLegend(sentenceLetters);
  const style = { 
    display: !schema.length ? 'none' : null, 
    backgroundColor: !key ? theme.palette.primary.main : theme.palette.grey['700']
  }

  const schemaTableData = [];
  for (let row = 0; row < numRows; row++) {
    const rowData = [];
    schema.forEach(e => {
      rowData.push(e.elType === 'L' && legend[e.value] ? legend[e.value][row] : null);
    });
    schemaTableData.push(rowData);
  }

  const schemaTableHeaders = getHeaders(schema);
  const schemaTable = getRows(schemaTableData);

  return getCardTable({
    key: key ? key : 'editor',
    style: style,
    headers: schemaTableHeaders,
    table: schemaTable
  });
}

const getSavedSchemataTables = (tableData) => {
  return tableData.schemataList?.map((schema, i) => getSchemaTable({
    key: `saved-${i}`,
    schema: schema,
    sentenceLetters: tableData.sentenceLetters
  }));
};


export { getLegendTable, getSchemaTable, getSavedSchemataTables };