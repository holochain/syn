cd ../ui/
npm run build
cd ../release/ui
rm -rf build
cp -r ../../ui/public/build/ build/
cd ..
npm run package-linux
