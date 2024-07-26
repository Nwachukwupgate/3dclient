import React, {useState, useEffect} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import config from '../config/config'
import state from '../store'
import { download } from "../assets"
import {downloadCanvasToImage, reader} from "../config/helpers"
import {EditorTabs, FilterTabs, DecalTypes} from "../config/constants"
import { fadeAnimation, slideAnimation } from '../config/motion'
import {AiPicker, ColorPicker, CustomButton, FilePicker, TabPicker } from "../components"


const Customizer = () => {
  const snap = useSnapshot(state);

  const [file, setFile] = useState('')

  const [prompt, setPrompt] = useState('')

  const [generatingImg, setGeneratingImg] = useState(false)

  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false,
  })

  const [run, setRun] = useState(false);

  const generateTabContent =() => {
    switch (activeEditorTab) {
      case "colorpicker":
        return <ColorPicker />
      case "filepicker":
        return <FilePicker file={file} setFile={setFile} readFile = {readFile} />
      case "aipicker":
        return <AiPicker prompt={prompt} setPrompt={setPrompt} generatingImg={generatingImg} handleSubmit={handleSubmit} />
      default:
        return null;
    }
  }

  const handleSubmit = async (type) => {
    if(!prompt) return alert("Please enter a prompt");

    if (run) {
      try {
        setGeneratingImg(true);

        const response = await fetch('http://localhost:8080/api/v1/dalle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
          }),
        });

        const data = await response.json();
        handleDecal(type, `data:image/png;base64,${data.photo}`);
      } catch (error) {
        alert(error);
      } finally {
        setGeneratingImg(false);
        setActiveEditorTab('');
      }
    } else {
      toast.error("Upgrade to paid version to run DALL-E.");
    }
  }

  const handleActiveFilterTab = (tabName) => {
    switch (tabName) {
      case "logoShirt":
          state.isLogoTexture = !activeFilterTab[tabName];
        break;
      case "stylishShirt":
          state.isFullTexture = !activeFilterTab[tabName];
        break;
      default:
        state.isFullTexture = false;
        state.isLogoTexture = true;
    }

    //after setting the state, activeFilterTab is updated
    setActiveFilterTab((prevState) => {
      return {
        ...prevState,
        [tabName] : !prevState[tabName]
      }
    })
  }

  const handleDecal = (type, result) => {
    const decalType = DecalTypes[type]

    state[decalType.stateProperty] = result;

    if(!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab)
    }
  }

  const readFile = (type) => {
    reader(file)
      .then((result) => {
        handleDecal(type, result);
        setActiveEditorTab("")
      })
  }

  return (
    <>
      <ToastContainer />
      <AnimatePresence> 
        {!snap.intro && (
          <>
            <motion.div className="absolute top-0 left-0 z-10" key="custom" {...slideAnimation('left')}>
              <div className='flex items-center min-h-screen'>
                <div className='editortabs-container tabs'>
                  {EditorTabs.map((tab) => (
                    <TabPicker key = {tab.name} tab={tab} handleClick={() => setActiveEditorTab(tab.name)}/>
                  ))}
                  {generateTabContent()}
                </div>

              </div>
            </motion.div>

          <motion.div className='absolute z-10 top-5 right-5' {...fadeAnimation}>
            <CustomButton type="filled" title="Go Back" handleClick={() => state.intro = true} customStyles="w-fit px-4 py-2.5 font-bold text-sm"/>
          </motion.div>

          <motion.div className="filtertabs-container" {...slideAnimation("up")}>
            {FilterTabs.map((tab) => (
              <TabPicker key = {tab.name} tab={tab} isFileredTab isActiveTab={activeFilterTab[tab.name]} handleClick={() => handleActiveFilterTab(tab.name)}/>
            ))}
          </motion.div>
          </>
        )
        }
      </AnimatePresence>
    </>
  )
}

export default Customizer