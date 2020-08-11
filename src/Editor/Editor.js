import React, { useContext } from 'react';
import Box from '@material-ui/core/Box';
import { DragDropContext } from 'react-beautiful-dnd';
import SentenceLetters from './SentenceLetters/SentenceLetters';
import LetterPicker from './LetterPicker/LetterPicker';
import OperatorPicker from './OperatorPicker/OperatorPicker';
import SchemaBuilder from './SchemaBuilder/SchemaBuilder';
import Context from '../context';
import dragEnd from './dragEnd';

const Editor = () => {
  const { schema, setSchema } = useContext(Context);
  const onDragEnd = (drag) => dragEnd(drag, schema, setSchema);
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box style={{display: 'flex'}}>
        <Box>
          <SentenceLetters/>
        </Box>
        <Box>
          <LetterPicker/>
        </Box>
        <Box ml="1rem">
          <OperatorPicker/>
        </Box>
      </Box>
      <Box mt="1rem">
        <SchemaBuilder/>
      </Box>
    </DragDropContext>
  );
}

export default Editor;
