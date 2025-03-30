import FaceMatcher from "./FaceMatcher";
import { imageData } from "./FaceMatcher";

function App() {
  return (
    <div className="App">
      <FaceMatcher mainImage={imageData.mainImage} imageArray={imageData.imageArray} />
    </div>
  );
}

export default App;
