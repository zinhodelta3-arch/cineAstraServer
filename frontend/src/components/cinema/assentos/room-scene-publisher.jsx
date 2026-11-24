'use client';

import RoomSceneBuilder from './room-scene-builder';

export default function RoomScenePublisher({
  path,
  request,
  seats,
  roomName,
  roomType,
  spaceType,
  publicSceneUrl,
  onPublished,
}) {
  const normalizedSceneUrl = publicSceneUrl || (path ? `/${String(path).replace(/^\/+/, '')}/scene` : '');
  return (
    <RoomSceneBuilder
      mode="room"
      path={path}
      request={request}
      seats={seats}
      roomName={roomName}
      roomType={roomType}
      spaceType={spaceType}
      publicSceneUrl={normalizedSceneUrl}
      onPublished={onPublished}
    />
  );
}
