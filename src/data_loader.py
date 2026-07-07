import os
import pandas as pd

SMD_PATH = os.path.join("data", "smd")

def load_machine(machine="machine-1-1"):
    
    train_path = os.path.join(SMD_PATH, "train", f"{machine}.txt")
    test_path = os.path.join(SMD_PATH, "test", f"{machine}.txt")
    label_path = os.path.join(SMD_PATH, "test_label", f"{machine}.txt")

    col_names = [f"metric_{i}" for i in range(38)]
    
    train = pd.read_csv(train_path, header=None, names=col_names)
    test = pd.read_csv(test_path, header=None, names= col_names)
    labels = pd.read_csv(label_path, header= None, names=["label"])

    return train, test, labels

if __name__ == "__main__":
    train, test, labels = load_machine("machine-1-1")
    print(f"Train : {train.shape}")
    print(f"Test : {test.shape}")
    print(f"Labels : {labels.shape}")
    print(f"Anomalies : {labels['label'].sum()}")
    print("\nApercu du train :")
    print(train.head())











