import { useRef, useState } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
export const useUUID = () => {
  const uuid = useRef(uuidv4());
  return uuid.current;
};
