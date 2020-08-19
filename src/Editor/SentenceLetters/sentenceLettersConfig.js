import Colors from '../../colors';

const getInputProps =  (sentenceLetters, setSentenceLetters) => {
  const min = 0, max = 6;
  const onChange = (event) => {
    if (event.target.value >= min && event.target.value <= max) {
      const number = Number(event.target.value);
      const letters = [...Array(number)].map((el, i) => {
        return {
          value: String.fromCharCode(112 + i), 
          bgColor: Colors[i]['500'],
          elType: 'L',
        }
      });
      setSentenceLetters([...letters]);
    } 
  };
  return {  
    type: 'number',
    min: min,
    max: max,
    value: sentenceLetters.length,
    onChange: onChange,
  };
};

export default getInputProps;
