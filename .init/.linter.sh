#!/bin/bash
cd /home/kavia/workspace/code-generation/notemaster-105046-9f1a98e5/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

