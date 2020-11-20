import React, { useContext } from 'react';
import Box from '@material-ui/core/Box';
import { DragDropContext } from 'react-beautiful-dnd';
import Context from '../context';
import dragEnd from './dragEnd';
import SentenceLetters from './SentenceLetters/SentenceLetters';
import LetterPicker from './LetterPicker/LetterPicker';
import OperatorPicker from './OperatorPicker/OperatorPicker';
import SchemaBuilder from './SchemaBuilder/SchemaBuilder';
import BuilderButtons from './BuilderButtons/BuilderButtons';

const Editor = () => {
  const { sentenceLetters, schema, setSchema, tutorialSteps, setTutorialSteps } = useContext(Context);
  const dragState = {
    sentenceLetters: sentenceLetters,
    schema: schema,
    setSchema: setSchema,
    tutorialSteps: tutorialSteps,
    setTutorialSteps: setTutorialSteps
  }
  const onDragEnd = (drag) => dragEnd(drag, dragState);
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
      <Box>
        <BuilderButtons/>
      </Box>
    </DragDropContext>
  );
}

export default Editor;
