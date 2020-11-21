const dragEnd = (drag, context) => {
  const { destination, source } = drag;
  const { premises, setPremises, conclusion, setConclusion } = context;
  const { index: sourceIndex, droppableId: sourceId } = source;
  if (sourceId === 'PremiseDropZone') {
    if (destination?.droppableId === 'PremiseDropZone') {
      const [el] = premises.splice(sourceIndex, 1);
      premises.splice(destination.index, 0, el);
      setPremises([...premises]);
    }
    if (destination?.droppableId === 'ConclusionDropZone') {
      const [el] = premises.splice(sourceIndex, 1);
      if (conclusion) setPremises([...premises, { ...conclusion, type: 'P'}]);
      setConclusion({...el, type : 'C'});
    }
    // delete by drag off 
    if (!destination) {
      premises.splice(sourceIndex, 1);
      setPremises([...premises]);
    }
  }
  if (sourceId === 'ConclusionDropZone') {
    if (destination?.droppableId === 'PremiseDropZone') {
      setPremises([...premises, {...conclusion, type: 'P'}]);
      setConclusion(null);
    }
    // delete by drag off 
    if (!destination) {
      setConclusion(null);
    }
  }
}

export default dragEnd;