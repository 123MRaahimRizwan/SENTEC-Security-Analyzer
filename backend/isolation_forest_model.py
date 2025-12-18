from log_feature_pipeline import process_logs
from sklearn.ensemble import IsolationForest
from sklearn.metrics import accuracy_score, classification_report
import pandas as pd
import numpy as np
import json

# Load and process features
feature_dict = process_logs("./dataset/server_logs.csv")

tfidf_matrix = feature_dict['tfidf_matrix']
df = feature_dict['features']
vectorizer = feature_dict['tfidf_vectorizer']

# Load ground truth labels
with open("./dataset/ground_truth.json") as file:
    content = json.load(file)
    keys = list(content.keys())
    values = list(content.values())

print("================== Data Frame ===========\n", df.head())

# Create labels dataframe and merge
y_labels = pd.DataFrame({'event_id': keys, 'defect': values})
df = df.merge(y_labels, on='event_id', how='left')

# Label Encoding
df['defect'] = df['defect'].fillna('No_Defect')

mapping = {
    'No_Defect': 0,
    'DOS': 1,
    'PORT_SCAN': 2,
    'BRUTE_FORCE': 3,
    'SQL_INJECTION': 4,
    'XSS': 5,
    'UNAUTHORIZED_ACCESS': 6,
    'COMMAND_INJECTION': 7,
    'PATH_TRAVERSAL': 8
}

df['defect'] = df['defect'].map(mapping)

# Prepare features for model
cols_to_drop = ['event_id', 'defect']
if 'session_id' in df.columns:
    cols_to_drop.append('session_id')

x = df.drop(columns=cols_to_drop, errors='ignore')
y = df['defect'].copy()

# Add TF-IDF features
tfidf_df = pd.DataFrame.sparse.from_spmatrix(tfidf_matrix, columns=vectorizer.get_feature_names_out())
x = pd.concat([x.reset_index(drop=True), tfidf_df.reset_index(drop=True)], axis=1)

# Calculate contamination from actual anomaly ratio
outlier_fraction = len(df[df['defect'] != 0]) / len(df)
print(f"Outlier fraction: {outlier_fraction:.4f}")

# Train Isolation Forest
model = IsolationForest(n_estimators=100, contamination=outlier_fraction, random_state=42)
model.fit(x)

# Predict and evaluate
y_test = y.copy()
y_test.loc[y_test != 0] = 1  # Binary: 0 = normal, 1 = anomaly

y_pred = model.predict(x)
y_pred = np.where(y_pred == 1, 0, 1)  # Convert: 1 -> 0 (normal), -1 -> 1 (anomaly)

print("Accuracy in finding anomaly:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# Flagged anomalies

# Get anomaly scores and flagged events
scores = model.decision_function(x)
df['anomaly_score'] = scores
df['is_anomaly'] = y_pred

flagged_df = df[df['is_anomaly'] == 1][['event_id', 'defect', 'anomaly_score']]

# print(f"\nFlagged {len(flagged_df)} anomalous events:")
# print(flagged_df.sort_values('anomaly_score'))


# Checking if flagged events are actually anomalies
# Check flagging accuracy
df['actual_anomaly'] = (df['defect'] != 0).astype(int)

# True Positives: correctly flagged as anomaly
true_positives = df[(df['is_anomaly'] == 1) & (df['actual_anomaly'] == 1)]

# False Positives: flagged but actually normal
false_positives = df[(df['is_anomaly'] == 1) & (df['actual_anomaly'] == 0)]

# False Negatives: missed anomalies
false_negatives = df[(df['is_anomaly'] == 0) & (df['actual_anomaly'] == 1)]

print(f"\n=== Flagging Analysis ===")
print(f"True Positives (correct flags): {len(true_positives)}")
print(f"False Positives (wrong flags): {len(false_positives)}")
print(f"False Negatives (missed): {len(false_negatives)}")

# Show some examples of each
print("\n--- Sample True Positives ---")
print(true_positives[['event_id', 'defect', 'anomaly_score']].head())

print("\n--- Sample False Positives ---")
print(false_positives[['event_id', 'defect', 'anomaly_score']].head())

print("\n--- Sample False Negatives ---")
print(false_negatives[['event_id', 'defect', 'anomaly_score']].head())

# Confusion matrix

import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

# Plot confusion matrix
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['Normal', 'Anomaly'])
disp.plot(cmap='Blues')
plt.title('Isolation Forest - Anomaly Detection')
plt.tight_layout()
plt.show()