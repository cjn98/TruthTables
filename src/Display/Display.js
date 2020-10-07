import React, { useContext } from 'react';
import { Paper, Box } from '@material-ui/core';
import './Display.scss';
import Context from '../context';
import EditorTable from './EditorTable/EditorTable';
import SavedTables from './SavedTables/SavedTables';

const Display = () => {
  const { sentenceLetters, schema, premises, conclusion } = useContext(Context);;
  const boxStyle = {
    display: schema.length > 0 || premises.length > 0 || conclusion ? 'flex' : 'none'
  };
  const paperStyle = {
    padding: '0.5rem', 
    display: 'flex',
    flexDirection: 'column'
  };
  return (
    <Box className="Display" mt="1rem" style={boxStyle}>
      <Paper elevation={5} style={paperStyle}>
        <EditorTable  
          sentenceLetters={sentenceLetters}
          schema={schema}
        />
        <SavedTables
          sentenceLetters={sentenceLetters}
          premises={premises}
        />
      </Paper>
    </Box>
  );
}

export default Display;